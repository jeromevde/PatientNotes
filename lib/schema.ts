// Rules the LLM output must match. If the model returns extra/missing fields, we reject it.

import { z } from "zod";

const claim = z.object({
  text: z.string().describe("One atomic clinical fact, one sentence"),
  quote: z
    .string()
    .nullable()
    .describe(
      "Verbatim substring of the transcript that supports this fact, or null",
    ),
});

export const consultationNotesSchema = z.object({
  consultation_id: z.string(),
  patient_id: z.string(),
  genere_le: z.string(),
  source: z.literal("transcript"),
  motif: z.array(claim),
  anamnese: z.array(claim).describe(
    "Atomic facts from the transcript. Mention labs only if they were spoken; do not invent values.",
  ),
  complements: z.array(
    z.object({
      produit_id: z
        .string()
        .describe("Must be an id from the catalog, never a free-text name"),
      posologie: z.string().nullable(),
      duree: z.string().nullable(),
      quote: z
        .string()
        .nullable()
        .describe("Verbatim substring of the transcript, or null"),
    }),
  ),
  hygiene_de_vie: z.array(claim),
  suivi: z.array(claim),
});

export type LlmNotes = z.infer<typeof consultationNotesSchema>;
