"use client";

// Note-taker workspace: transcript and structured notes are two panes.
// Each pane scrolls on its own. After Generate, quotes on the open tab paint the transcript.

import { useState } from "react";
import { NotesEditor, noteTabs } from "@/components/NotesEditor";
import { TranscriptView } from "@/components/TranscriptView";
import { quotesForTab, type NoteTab } from "@/lib/quotes";
import type { ConsultationNotes } from "@/lib/types";

function ExtractionWait() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy="true" aria-live="polite">
      <div className="flex flex-wrap gap-1 border-b border-line pb-2">
        {noteTabs.map((t, i) => (
          <span
            key={t.id}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              i === 0 ? "bg-accent text-white" : "text-muted"
            }`}
          >
            {t.label}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">
        Extraction en cours · environ 5 secondes
      </p>
      <div className="mt-4 space-y-3">
        <div className="h-4 w-11/12 animate-pulse rounded bg-line" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-line" />
        <div className="h-4 w-10/12 animate-pulse rounded bg-line" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
      </div>
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
  error,
}: {
  transcript: string;
  onTranscriptChange: (value: string) => void;
  notes: ConsultationNotes | null;
  onNotesChange: (notes: ConsultationNotes) => void;
  onGenerate: () => void;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [tab, setTab] = useState<NoteTab>("motif");
  const [focusQuote, setFocusQuote] = useState<string | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <button type="button" onClick={onBack} className="text-sm text-muted hover:text-ink">
            ← Dossier
          </button>
          <h1 className="mt-1 font-serif text-2xl text-ink">Note de consultation</h1>
          <p className="text-sm text-muted">
            Transcript à gauche, notes à droite — vérifiez avant de confirmer.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {notes ? (
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
              {notes.used_llm ? "Généré par le modèle" : "Notes mockées (pas de clé API)"}
            </span>
          ) : null}
          <button
            type="button"
            disabled={loading || transcript.trim().length < 20}
            onClick={onGenerate}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Génération…" : notes ? "Regénérer" : "Générer les notes"}
          </button>
          <button
            type="button"
            disabled={!notes || loading}
            onClick={onConfirm}
            className="rounded-full border border-accent px-4 py-2 text-sm font-medium text-accent disabled:opacity-40"
          >
            Confirmer
          </button>
        </div>
      </header>

      {error ? (
        <p className="shrink-0 border-b border-line bg-warn-soft px-5 py-2 text-sm text-warn">{error}</p>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1">
        <section className="flex min-h-0 flex-col overflow-hidden border-b border-line lg:border-b-0 lg:border-r">
          <div className="shrink-0 px-5 pt-4">
            <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
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

        <section className="flex min-h-0 flex-col overflow-hidden px-5 py-4">
          <p className="mb-3 shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Notes structurées
          </p>
          {loading ? (
            <ExtractionWait />
          ) : notes ? (
            <NotesEditor
              notes={notes}
              transcript={transcript}
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
            <p className="text-sm text-muted">
              Collez le transcript, puis générez. Les notes apparaîtront ici, à côté du
              texte source.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
