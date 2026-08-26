"use client";

// Note-taker workspace: transcript on the left, structured notes on the right.
// Layout only — the notes tabs live in NotesEditor.

import { NotesEditor } from "@/components/NotesEditor";
import type { ConsultationNotes } from "@/lib/types";

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
  return (
    <div className="flex min-h-[calc(100vh-40px)] flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
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
        <p className="border-b border-line bg-warn-soft px-5 py-2 text-sm text-warn">{error}</p>
      ) : null}

      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <section className="flex min-h-[50vh] flex-col overflow-hidden border-b border-line lg:min-h-0 lg:border-b-0 lg:border-r">
          <label className="px-5 pt-4 text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Transcript
          </label>
          <textarea
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            className="min-h-0 flex-1 resize-none overflow-y-auto bg-transparent px-5 py-3 text-sm leading-relaxed text-ink outline-none"
          />
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden px-5 py-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Notes structurées
          </p>
          {loading ? (
            <p className="text-sm text-muted">Extraction en cours…</p>
          ) : notes ? (
            <NotesEditor notes={notes} onChange={onNotesChange} />
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
