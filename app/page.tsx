"use client";

// The only page. Switches between the patient dossier and the note-taker.
// Holds transcript + draft notes in memory. Enregistrer adds a visit and
// writes the note's complements onto the plan. Refresh resets the mock patient.

import { useEffect, useRef, useState } from "react";
import { DossierView } from "@/components/DossierView";
import { NoteTakerView, type ExtractionStatus } from "@/components/NoteTakerView";
import { planAfterNote } from "@/lib/complements";
import { patientDossier, sampleTranscript } from "@/lib/data";
import type { ConsultationNotes } from "@/lib/types";

type Step = "dossier" | "note";
type Simulate = "invalid_json" | "wrong_id";

declare global {
  interface Window {
    simulate_wrong_json?: () => void;
    simulate_wrong_id?: () => void;
  }
}

/** Blank note the practitioner fills in by hand when extraction fails. Current recs stay on the note (code will show them as maintien). */
function emptyNotes(recs: typeof patientDossier.recommandations_en_cours): ConsultationNotes {
  return {
    consultation_id: sampleTranscript.consultation_id,
    patient_id: sampleTranscript.patient_id,
    genere_le: new Date().toISOString().slice(0, 10),
    source: "transcript",
    used_llm: false,
    motif: [],
    anamnese: [],
    complements: recs.map((r) => ({
      produit_id: r.produit_id,
      posologie: r.posologie,
      duree: null,
      quote: null,
    })),
    hygiene_de_vie: [],
    suivi: [],
  };
}

export default function HomePage() {
  const [step, setStep] = useState<Step>("dossier");
  const [transcript, setTranscript] = useState(sampleTranscript.text);
  const [visits, setVisits] = useState(patientDossier.historique_consultations);
  const [plan, setPlan] = useState(patientDossier.recommandations_en_cours);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [flashPlan, setFlashPlan] = useState(false);
  const [draft, setDraft] = useState<ConsultationNotes | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ExtractionStatus | null>(null);

  async function generate(simulate?: Simulate) {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          patient: {
            ...patientDossier,
            recommandations_en_cours: plan,
            historique_consultations: visits,
          },
          consultation_id: sampleTranscript.consultation_id,
          patient_id: sampleTranscript.patient_id,
          simulate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const fallback = !draft;
        setStatus({
          kind: "error",
          message:
            (data.error || "Échec de l'extraction. Réessayer.") +
            (fallback ? " La note est vide, à compléter à la main." : ""),
        });
        if (fallback) setDraft(emptyNotes(plan));
        return;
      }
      const { raw, sent, warning, ...notes } = data;
      if (sent) {
        console.log("[llm sent] model: " + sent.model);
        console.log("[llm sent] system:\n" + sent.system);
        console.log("[llm sent] user:\n" + sent.user);
      }
      if (typeof raw === "string") {
        console.log("[llm raw]\n" + raw);
      } else {
        console.log("[llm] mock notes (no raw model text)", notes);
      }
      setDraft(notes as ConsultationNotes);
      setStatus(
        warning ? { kind: "warning", message: warning as string } : null,
      );
    } catch (e) {
      console.error("[generate] client-side failure before/during the request:", e);
      const fallback = !draft;
      setStatus({
        kind: "error",
        message:
          `Échec de l'extraction. Réessayer.` +
          (fallback ? " La note est vide, à compléter à la main." : ""),
      });
      if (fallback) setDraft(emptyNotes(plan));
    } finally {
      setLoading(false);
    }
  }

  const generateRef = useRef(generate);
  generateRef.current = generate;

  useEffect(() => {
    window.simulate_wrong_json = () => generateRef.current("invalid_json");
    window.simulate_wrong_id = () => generateRef.current("wrong_id");
    console.log(
      "[dev] simulate_wrong_json() and simulate_wrong_id() are available in this console to force an extraction failure/warning without calling the model.",
    );
    return () => {
      delete window.simulate_wrong_json;
      delete window.simulate_wrong_id;
    };
  }, []);

  return (
    <div className="flex h-dvh flex-col">
      <div className="shrink-0 border-b border-line bg-card px-5 py-2 text-center text-xs text-muted">
        Prototype Simplycure · données 100 % fictives · ne pas utiliser de vraies données
        patient
      </div>

      {step === "dossier" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <DossierView
            consultations={visits}
            recs={plan}
            highlightVisitId={justAddedId}
            highlightPlan={flashPlan}
            onHighlightDone={() => setJustAddedId(null)}
            onPlanFlashDone={() => setFlashPlan(false)}
            onStartNote={() => setStep("note")}
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden">
          <NoteTakerView
            transcript={transcript}
            onTranscriptChange={setTranscript}
            notes={draft}
            onNotesChange={setDraft}
            onGenerate={() => generate()}
            currentRecs={plan}
            onConfirm={() => {
              if (!draft) return;
              const id = `cons_${Date.now()}`;
              const today = new Date().toISOString().slice(0, 10);
              const motif =
                draft.motif.map((item) => item.text).find((text) => text.trim()) ||
                "Consultation";
              setVisits((current) => [
                ...current,
                {
                  id,
                  date: today,
                  motif,
                },
              ]);
              setPlan(planAfterNote(plan, draft.complements, today));
              setJustAddedId(id);
              setFlashPlan(true);
              setDraft(null);
              setStatus(null);
              setStep("dossier");
            }}
            onBack={() => setStep("dossier")}
            loading={loading}
            status={status}
          />
        </div>
      )}
    </div>
  );
}
