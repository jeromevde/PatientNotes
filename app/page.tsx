"use client";

// The only page. Switches between the patient dossier and the note-taker.
// Holds transcript + draft notes in memory. Confirm attaches the note; it does not write the patient file.

import { useState } from "react";
import { DossierView } from "@/components/DossierView";
import { NoteTakerView } from "@/components/NoteTakerView";
import { patientDossier, sampleTranscript } from "@/lib/data";
import type { ConsultationNotes } from "@/lib/types";

type Step = "dossier" | "note";

export default function HomePage() {
  const [step, setStep] = useState<Step>("dossier");
  const [transcript, setTranscript] = useState(sampleTranscript.text);
  const [draft, setDraft] = useState<ConsultationNotes | null>(null);
  const [attached, setAttached] = useState<ConsultationNotes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          patient: patientDossier,
          consultation_id: sampleTranscript.consultation_id,
          patient_id: sampleTranscript.patient_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec de la génération");
      }
      setDraft(data as ConsultationNotes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-line bg-warn-soft px-5 py-2 text-center text-xs text-warn">
        Prototype Simplycure · données 100 % fictives · ne pas utiliser de vraies données
        patient
      </div>

      {step === "dossier" ? (
        <DossierView
          attachedNotes={attached}
          onStartNote={() => setStep("note")}
        />
      ) : (
        <NoteTakerView
          transcript={transcript}
          onTranscriptChange={setTranscript}
          notes={draft}
          onNotesChange={setDraft}
          onGenerate={generate}
          onConfirm={() => {
            if (!draft) return;
            setAttached(draft);
            setStep("dossier");
          }}
          onBack={() => setStep("dossier")}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}
