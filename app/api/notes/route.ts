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
  /** Dev-only: force a specific failure/warning path without calling the model. See simulate_*() in the browser console. */
  simulate: z.enum(["invalid_json", "wrong_id"]).optional(),
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
- Compléments: liste les produits du plan qui continuent ou qui commencent (id du catalogue, posologie, durée, quote). N'inclus PAS un produit qu'on arrête. N'écris PAS de champ "action": le code le déduit (présent + déjà en cours = maintien, présent + nouveau = ajout, déjà en cours et absent de la liste = arrêt). Plusieurs SKUs peuvent partager le même ingredient — choisis un id. Pour un produit déjà en cours que l'on continue, garde l'id déjà en cours.
- La liste "déjà en cours" dit quels ids existent aujourd'hui. Ce n'est pas une source de faits ni de quotes.
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
  return `Compléments déjà en cours (inclus-les si on continue, omets-les si on arrête — pas de champ action):
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
  "complements": [
    { "produit_id": "prd_...", "posologie": "...", "duree": null, "quote": "extrait exact du transcript" }
  ],
  "hygiene_de_vie": [{ "text": "une phrase", "quote": "extrait exact du transcript" }],
  "suivi": [{ "text": "une phrase", "quote": "extrait exact du transcript" }]
}`;
}

function parseNotesJson(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : trimmed).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ExtractionError(
      "invalid_json",
      "L'extraction a échoué : la réponse de l'IA était illisible (erreur technique : JSON invalide). Réessayez la génération.",
    );
  }
  const result = consultationNotesSchema.safeParse(parsed);
  if (!result.success) {
    throw new ExtractionError(
      "invalid_structure",
      "L'extraction a échoué : les informations renvoyées par l'IA sont incomplètes ou mal formées. Réessayez la génération.",
    );
  }
  return result.data;
}

type ExtractionErrorKind = "empty_response" | "invalid_json" | "invalid_structure" | "network";

class ExtractionError extends Error {
  kind: ExtractionErrorKind;
  constructor(kind: ExtractionErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

const DROPPED_PRODUCT_WARNING =
  "Attention : un produit mentionné ne correspond à aucune référence du catalogue et a été retiré automatiquement des compléments. Vérifiez la note avant de confirmer.";

function attachMeta(
  notes: z.infer<typeof consultationNotesSchema>,
  used_llm: boolean,
  consultation_id: string,
  patient_id: string,
): { notes: ConsultationNotes; droppedProductIds: string[] } {
  const allowed = new Set(products.map((p) => p.id));
  const droppedProductIds = notes.complements
    .filter((c) => !allowed.has(c.produit_id))
    .map((c) => c.produit_id);
  return {
    notes: {
      ...notes,
      consultation_id,
      patient_id,
      source: "transcript",
      used_llm,
      complements: notes.complements.filter((c) => allowed.has(c.produit_id)),
    },
    droppedProductIds,
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

  const { transcript, patient, consultation_id, patient_id, simulate } = parsed.data;
  const recs = recsFromPatient(patient);
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (simulate === "invalid_json") {
    console.log("[llm] simulate_wrong_json — forcing an invalid_json extraction failure");
    const err = new ExtractionError(
      "invalid_json",
      "L'extraction a échoué : la réponse de l'IA était illisible (erreur technique : JSON invalide). Réessayez la génération.",
    );
    return NextResponse.json({ error: err.message, kind: err.kind }, { status: 502 });
  }

  if (simulate === "wrong_id") {
    console.log("[llm] simulate_wrong_id — forcing a hallucinated produit_id through the real filtering logic");
    const fakeNotes = {
      ...mockNotes,
      complements: [
        ...mockNotes.complements,
        {
          produit_id: "prd_does_not_exist",
          posologie: "1 gélule/jour",
          duree: null,
          quote: null,
        },
      ],
    };
    const { notes: result, droppedProductIds } = attachMeta(
      fakeNotes,
      false,
      consultation_id,
      patient_id,
    );
    return NextResponse.json({
      ...keepVerbatimQuotes(transcript, result),
      warning: droppedProductIds.length > 0 ? DROPPED_PRODUCT_WARNING : null,
    });
  }

  if (!apiKey) {
    console.log("[llm] no API key — returning mock notes");
    const { notes: mockResult, droppedProductIds } = attachMeta(
      mockNotes,
      false,
      consultation_id,
      patient_id,
    );
    return NextResponse.json({
      ...keepVerbatimQuotes(transcript, mockResult),
      warning:
        droppedProductIds.length > 0
          ? DROPPED_PRODUCT_WARNING
          : null,
    });
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
    const system = systemPrompt();
    const user = userPrompt({ transcript, recs, consultation_id, patient_id });
    console.log("[llm sent] model: " + model);
    console.log("[llm sent] system:\n" + system);
    console.log("[llm sent] user:\n" + user);
    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message.content;
    if (!content) {
      throw new ExtractionError(
        "empty_response",
        "L'extraction a échoué : l'IA n'a renvoyé aucun contenu. Réessayez la génération.",
      );
    }
    console.log("[llm raw]\n" + content);
    const notes = parseNotesJson(content);
    const { notes: result, droppedProductIds } = attachMeta(
      notes,
      true,
      consultation_id,
      patient_id,
    );

    return NextResponse.json({
      ...keepVerbatimQuotes(transcript, result),
      raw: content,
      sent: { model, system, user },
      warning:
        droppedProductIds.length > 0
          ? DROPPED_PRODUCT_WARNING
          : null,
    });
  } catch (err) {
    console.error(err);
    if (err instanceof ExtractionError) {
      return NextResponse.json(
        { error: err.message, kind: err.kind },
        { status: 502 },
      );
    }
    return NextResponse.json(
      {
        error:
          "L'extraction a échoué : impossible de contacter le service d'IA. Vérifiez la connexion et réessayez.",
        kind: "network",
      },
      { status: 502 },
    );
  }
}
