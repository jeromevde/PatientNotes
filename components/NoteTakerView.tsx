"use client";

// Note-taker workspace: transcript and structured notes are two panes.
// Each pane scrolls on its own. After Generate, quotes on the open tab paint the transcript.

import { useState } from "react";
import { NotesEditor, noteTabs } from "@/components/NotesEditor";
import { TranscriptView } from "@/components/TranscriptView";
import { patientDossier, sampleTranscript } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { quotesForTab, type NoteTab } from "@/lib/quotes";
import type { CurrentRec } from "@/lib/complements";
import type { ConsultationNotes } from "@/lib/types";

export type ExtractionStatus = { kind: "ok" | "warning" | "error"; message: string };

function ExtractionWait() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy="true" aria-live="polite">
      <div className="flex flex-wrap gap-1 border-b border-line pb-2">
        {noteTabs.map((t, i) => (
          <span
            key={t.id}
            className={`px-3 py-1.5 text-sm font-medium ${
              i === 0
                ? "text-ink"
                : "text-muted"
            }`}
            style={i === 0 ? { borderBottom: "2px solid var(--accent)" } : undefined}
          >
            {t.label}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">Génération en cours (environ 10s)…</p>
      <div className="mt-4 space-y-3">
        <div className="h-4 w-11/12 animate-pulse rounded bg-line" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-line" />
        <div className="h-4 w-10/12 animate-pulse rounded bg-line" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
      </div>
    </div>
  );
}

function GeneratePrompt({
  onGenerate,
  disabled,
}: {
  onGenerate: () => void;
  disabled: boolean;
}) {
  return (
    <div>
      <div className="mb-2 text-[15px] font-semibold">Générer la note structurée</div>
      <p className="mb-5 text-[13.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
        Le transcript est analysé avec le plan en cours et le catalogue produits. Chaque élément extrait
        reste rattaché à sa citation source et rien n&rsquo;entre au dossier sans validation du praticien.
      </p>
      <button
        type="button"
        onClick={onGenerate}
        disabled={disabled}
        className="btn btn-primary"
      >
        Générer la note
      </button>
      {disabled ? (
        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          Collez un transcript d&rsquo;au moins 20 caractères pour activer l&rsquo;analyse.
        </p>
      ) : null}
    </div>
  );
}

export function NoteTakerView({
  transcript,
  onTranscriptChange,
  notes,
  onNotesChange,
  onGenerate,
  onConfirm,
  onBack,
  loading,
  status,
  currentRecs,
}: {
  transcript: string;
  onTranscriptChange: (value: string) => void;
  notes: ConsultationNotes | null;
  onNotesChange: (notes: ConsultationNotes) => void;
  onGenerate: () => void;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
  status: ExtractionStatus | null;
  currentRecs: CurrentRec[];
}) {
  const [tab, setTab] = useState<NoteTab>("motif");
  const [focusQuote, setFocusQuote] = useState<string | null>(null);
  const canGenerate = !loading && transcript.trim().length >= 20;

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: "var(--paper)" }}>
      <header
        className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b bg-card px-6 py-3"
        style={{ borderColor: "var(--line)" }}
      >
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-1 inline-block text-xs hover:text-accent"
            style={{ color: "var(--muted)" }}
          >
            ← Retour
          </button>
          <h1 className="text-[18px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
            Note de consultation
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            {patientDossier.patient.prenom} {patientDossier.patient.nom} · {formatDate(sampleTranscript.date)}
          </p>
        </div>
        {notes ? (
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                disabled={!canGenerate}
                onClick={onGenerate}
                className="btn btn-secondary"
              >
                {loading ? "Génération…" : "Regénérer"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className="btn btn-primary"
              >
                Enregistrer dans le dossier patient
              </button>
            </div>
            {status && status.kind !== "ok" ? (
              <p className="max-w-md text-right text-[13px]" style={{ color: "var(--muted)" }}>
                {status.message}
              </p>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-2 gap-4 p-4 lg:grid-cols-2 lg:grid-rows-1">
        <section className="sc-card flex min-h-0 flex-col overflow-hidden">
          <div className="shrink-0 px-4 pt-3">
            <label className="text-[13px] font-medium" style={{ color: "var(--muted)" }}>
              Transcript
            </label>
          </div>
          <TranscriptView
            transcript={transcript}
            onChange={onTranscriptChange}
            quotes={notes ? quotesForTab(notes, tab, transcript) : []}
            activeQuote={focusQuote}
            once={tab === "complements"}
            onPickQuote={setFocusQuote}
          />
        </section>

        <section className="sc-card flex min-h-0 flex-col overflow-hidden px-4 py-3">
          <p className="mb-3 shrink-0 text-[13px] font-medium" style={{ color: "var(--muted)" }}>
            Notes structurées
          </p>
          {loading ? (
            <ExtractionWait />
          ) : notes ? (
            <NotesEditor
              notes={notes}
              transcript={transcript}
              currentRecs={currentRecs}
              onChange={onNotesChange}
              tab={tab}
              onTabChange={(next) => {
                setTab(next);
                setFocusQuote(null);
              }}
              focusQuote={focusQuote}
              onFocusQuote={setFocusQuote}
            />
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <GeneratePrompt onGenerate={onGenerate} disabled={!canGenerate} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
