// POST /api/notes — the only backend.
// Takes a transcript + current recs + catalog. The model never sees the rest of the dossier
// (history, identity, labs) so it cannot quote those as if they were spoken.

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { consultationNotesSchema } from "@/lib/schema";
import { mockNotes, productById, products } from "@/lib/data";
import { keepVerbatimQuotes } from "@/lib/quotes";
import type { ConsultationNotes } from "@/lib/types";

const recSchema = z.object({
  produit_id: z.string(),
  posologie: z.string(),
  depuis: z.string(),
});

const requestSchema = z.object({
  transcript: z.string().min(20),
  patient: z.unknown(),
  consultation_id: z.string(),
  patient_id: z.string(),
});

type CurrentRec = z.infer<typeof recSchema>;

function recsFromPatient(patient: unknown): CurrentRec[] {
  const parsed = z
    .object({ recommandations_en_cours: z.array(recSchema) })
    .safeParse(patient);
  return parsed.success ? parsed.data.recommandations_en_cours : [];
}

function catalogBlock(): string {
  return products
    .map(
      (p) =>
        `- ${p.id}: ${p.nom} (${p.labo}, ${p.ingredient}, ${p.prix} €)`,
    )
    .join("\n");
}

function recsBlock(recs: CurrentRec[]): string {
  if (recs.length === 0) return "(aucun complément en cours)";
  return recs
    .map((r) => {
      const name = productById(r.produit_id)?.nom ?? r.produit_id;
      return `- ${r.produit_id}: ${name} · ${r.posologie} · depuis ${r.depuis}`;
    })
    .join("\n");
}

function systemPrompt(): string {
  return `Tu es un assistant de notes cliniques pour des praticiens Simplycure (naturopathie / micronutrition).
Tu transcris une consultation en notes structurées. Tu n'inventes rien.

Règles:
- Langue: français.
- Motif, anamnèse, hygiène de vie et suivi : tableau de faits atomiques. Chaque item = une phrase clinique ("text") + un "quote" recopié TEL QUEL depuis le transcript (sous-chaîne exacte), ou null. Un fait = une phrase. Pas de paragraphe unique.
- Les faits et les quotes viennent UNIQUEMENT du transcript. Jamais de l'historique, des labs, ni d'un autre champ dossier. Pas d'extrait exact → quote = null.
- Ne pas inventer de valeurs de laboratoire. Mentionne un bilan seulement s'il est dit dans le transcript.
- Les compléments: produit_id DOIT être un id du catalogue. Plusieurs SKUs peuvent partager le même ingredient (labs différents) — choisis un id, le praticien pourra en changer. Pour un maintien, garde l'id déjà en cours.
- La liste "déjà en cours" sert UNIQUEMENT à choisir action (maintien / ajout / arrêt). Ce n'est pas une source de faits ni de quotes.
- action: "maintien" si déjà en cours et on continue, "ajout" si nouveau, "arret" si on arrête.
- Réponds UNIQUEMENT avec un objet JSON valide. Pas de markdown, pas de backticks.

Catalogue:
${catalogBlock()}`;
}

function userPrompt(input: {
  transcript: string;
  recs: CurrentRec[];
  consultation_id: string;
  patient_id: string;
}): string {
  return `Compléments déjà en cours (pour action seulement, jamais comme quote):
${recsBlock(input.recs)}

Consultation id: ${input.consultation_id}
Patient id: ${input.patient_id}
Date du jour (génère_le): ${new Date().toISOString().slice(0, 10)}

Transcript (seule source des faits et des quotes):
${input.transcript}

Forme JSON attendue:
{
  "consultation_id": "...",
  "patient_id": "...",
  "genere_le": "YYYY-MM-DD",
  "source": "transcript",
  "motif": [{ "text": "une phrase", "quote": "extrait exact du transcript" }],
  "anamnese": [{ "text": "une phrase", "quote": "extrait exact du transcript" }],
  "complements": [{ "produit_id": "prd_...", "action": "maintien|ajout|arret", "posologie": "...", "duree": null, "quote": "..." }],
  "hygiene_de_vie": [{ "text": "une phrase", "quote": "extrait exact du transcript" }],
  "suivi": [{ "text": "une phrase", "quote": "extrait exact du transcript" }]
}`;
}

function parseNotesJson(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : trimmed).trim();
  return consultationNotesSchema.parse(JSON.parse(raw));
}

function attachMeta(
  notes: z.infer<typeof consultationNotesSchema>,
  used_llm: boolean,
  consultation_id: string,
  patient_id: string,
): ConsultationNotes {
  const allowed = new Set(products.map((p) => p.id));
  return {
    ...notes,
    consultation_id,
    patient_id,
    source: "transcript",
    used_llm,
    complements: notes.complements.filter((c) => allowed.has(c.produit_id)),
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Transcript trop court ou requête invalide." },
      { status: 400 },
    );
  }

  const { transcript, patient, consultation_id, patient_id } = parsed.data;
  const recs = recsFromPatient(patient);
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.log("[llm] no API key — returning mock notes");
    return NextResponse.json(
      keepVerbatimQuotes(
        transcript,
        attachMeta(mockNotes, false, consultation_id, patient_id),
      ),
    );
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
        "X-Title": "Simplycure note-taker",
      },
    });
    const model =
      process.env.OPENROUTER_MODEL ?? "anthropic/claude-haiku-4.5";
    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt() },
        {
          role: "user",
          content: userPrompt({
            transcript,
            recs,
            consultation_id,
            patient_id,
          }),
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message.content;
    if (!content) {
      throw new Error("Empty model response");
    }
    console.log("[llm raw]\n" + content);
    const notes = parseNotesJson(content);

    return NextResponse.json({
      ...keepVerbatimQuotes(
        transcript,
        attachMeta(notes, true, consultation_id, patient_id),
      ),
      raw: content,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Le modèle n'a pas pu générer les notes. Réessayez." },
      { status: 502 },
    );
  }
}
