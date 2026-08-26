// Rules the LLM output must match. If the model returns extra/missing fields, we reject it.

import { z } from "zod";

const quotedText = z.object({
  text: z.string(),
  quote: z
    .string()
    .nullable()
    .describe("Exact short excerpt from the transcript, or null if none"),
});

export const consultationNotesSchema = z.object({
  consultation_id: z.string(),
  patient_id: z.string(),
  genere_le: z.string(),
  source: z.literal("transcript"),
  motif: quotedText,
  anamnese: quotedText.describe(
    "Free-text history. May mention labs already on the dossier; do not invent lab values.",
  ),
  complements: z.array(
    z.object({
      produit_id: z
        .string()
        .describe("Must be an id from the catalog, never a free-text name"),
      action: z.enum(["maintien", "ajout", "arret"]),
      posologie: z.string().nullable(),
      duree: z.string().nullable(),
      quote: z.string().nullable(),
    }),
  ),
  hygiene_de_vie: quotedText,
  suivi: quotedText,
});

export type LlmNotes = z.infer<typeof consultationNotesSchema>;
