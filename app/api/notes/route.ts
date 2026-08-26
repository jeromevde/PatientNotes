// POST /api/notes — the only backend.
// Takes a free-text transcript + patient + catalog, asks the LLM for structured notes,
// checks product ids against the catalog. No API key → returns the mock notes instead.

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { consultationNotesSchema } from "@/lib/schema";
import { mockNotes, products } from "@/lib/data";
import type { ConsultationNotes, PatientDossier } from "@/lib/types";

const requestSchema = z.object({
  transcript: z.string().min(20),
  patient: z.unknown(),
  consultation_id: z.string(),
  patient_id: z.string(),
});

function catalogBlock(): string {
  return products
    .map(
      (p) =>
        `- ${p.id}: ${p.nom} (${p.labo}, ${p.ingredient}, ${p.prix} €)`,
    )
    .join("\n");
}

function systemPrompt(): string {
  return `Tu es un assistant de notes cliniques pour des praticiens Simplycure (naturopathie / micronutrition).
Tu transcris une consultation en notes structurées. Tu n'inventes rien.

Règles:
- Langue: français.
- Chaque champ important a un "quote": extrait COURT et EXACT du transcript, ou null.
- Ne cite que des faits présents dans le transcript ou le dossier patient fourni.
- Les sections motif, anamnèse, hygiène de vie et suivi sont du texte libre. Adapte le contenu à CE qui a été dit — n'invente pas de sous-rubriques.
- Les biomarqueurs du dossier sont déjà saisis par un autre flux (labo / PDF). Ne les recopie pas dans un tableau. Tu peux les mentionner dans l'anamnèse s'ils ont été discutés.
- Les compléments: produit_id DOIT être un id du catalogue. Plusieurs SKUs peuvent partager le même ingredient (labs différents) — choisis un id, le praticien pourra en changer. Pour un maintien, garde l'id déjà en cours dans le dossier.
- action: "maintien" si déjà en cours et on continue, "ajout" si nouveau, "arret" si on arrête.
- Réponds UNIQUEMENT avec un objet JSON valide. Pas de markdown, pas de backticks.

Catalogue:
${catalogBlock()}`;
}

function userPrompt(input: {
  transcript: string;
  patient: unknown;
  consultation_id: string;
  patient_id: string;
}): string {
  return `Dossier patient (JSON):
${JSON.stringify(input.patient, null, 2)}

Consultation id: ${input.consultation_id}
Patient id: ${input.patient_id}
Date du jour (génère_le): ${new Date().toISOString().slice(0, 10)}

Transcript (texte libre):
${input.transcript}

Forme JSON attendue:
{
  "consultation_id": "...",
  "patient_id": "...",
  "genere_le": "YYYY-MM-DD",
  "source": "transcript",
  "motif": { "text": "...", "quote": "..." },
  "anamnese": { "text": "...", "quote": "..." },
  "complements": [{ "produit_id": "prd_...", "action": "maintien|ajout|arret", "posologie": "...", "duree": null, "quote": "..." }],
  "hygiene_de_vie": { "text": "...", "quote": "..." },
  "suivi": { "text": "...", "quote": "..." }
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
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      attachMeta(mockNotes, false, consultation_id, patient_id),
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
            patient: patient as PatientDossier,
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
    const notes = parseNotesJson(content);

    return NextResponse.json(
      attachMeta(notes, true, consultation_id, patient_id),
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Le modèle n'a pas pu générer les notes. Réessayez." },
      { status: 502 },
    );
  }
}
