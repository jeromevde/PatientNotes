// Loads the mock JSON from /data and helpers to look up a product.

import type { ConsultationNotes, Product } from "./types";
import mockFile from "../data/notes.json";
import productsFile from "../data/products.json";
import patientFile from "../data/patient.json";
import transcriptFile from "../data/transcript.json";
import type { PatientDossier } from "./types";

export const products = productsFile as Product[];
export const patientDossier = patientFile as PatientDossier;
export const sampleTranscript = transcriptFile as {
  consultation_id: string;
  patient_id: string;
  date: string;
  text: string;
};

export function productById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function formatPrice(prix: number): string {
  return prix.toLocaleString("fr-BE", {
    style: "currency",
    currency: "EUR",
  });
}

export const mockNotes = mockFile as ConsultationNotes;
