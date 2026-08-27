"use client";

// Note-taker workspace: transcript and structured notes are two panes.
// Each pane scrolls on its own. After Generate, quotes on the open tab paint the transcript.
// Header + empty state use their own fonts/colors (matching the dossier redesign) so they
// don't touch the rest of the app's look. Editing logic, quotes, and the /api/notes call are untouched.

import { useState } from "react";
import { Newsreader, Instrument_Sans } from "next/font/google";
import { NotesEditor, noteTabs } from "@/components/NotesEditor";
import { TranscriptView } from "@/components/TranscriptView";
import { patientDossier, products, sampleTranscript } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { quotesForTab, type NoteTab } from "@/lib/quotes";
import type { ConsultationNotes } from "@/lib/types";

const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-notetaker-serif",
});
const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-notetaker-sans",
});

const serifFont = { fontFamily: "var(--font-notetaker-serif), Georgia, serif" };
const sansFont = { fontFamily: "var(--font-notetaker-sans), Helvetica, Arial, sans-serif" };

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
      <p className="mt-4 text-sm text-muted">Génération en cours…</p>
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
  const { recommandations_en_cours, biomarqueurs_recents } = patientDossier;
  const latestBioDate = biomarqueurs_recents.reduce(
    (max, b) => (b.date > max ? b.date : max),
    biomarqueurs_recents[0]?.date ?? "",
  );
  const abnormalCount = biomarqueurs_recents.filter((b) => b.statut !== "normal").length;

  const context = [
    recommandations_en_cours.length > 0
      ? `Plan en cours chargé · ${recommandations_en_cours.length} produit(s)`
      : null,
    biomarqueurs_recents.length > 0
      ? `Bilan du ${formatDate(latestBioDate)} chargé · ${abnormalCount} valeur(s) à surveiller sur ${biomarqueurs_recents.length}`
      : null,
    `Catalogue produits · ${products.length} références disponibles`,
    "Sortie relue par le praticien avant tout ajout au dossier",
  ].filter((x): x is string => Boolean(x));

  return (
    <div
      className={`${serif.variable} ${sans.variable} rounded-2xl p-6`}
      style={{ ...sansFont, background: "#FFFDF9", border: "1px solid #E6DFD1" }}
    >
      <div style={{ ...serifFont, fontSize: 20, marginBottom: 8 }}>Générer la note structurée</div>
      <p style={{ fontSize: 13.5, color: "#6E6759", lineHeight: 1.6, marginBottom: 18 }}>
        Le transcript est analysé avec le contexte du dossier : plan en cours, biomarqueurs, catalogue
        produits. Chaque élément extrait reste rattaché à sa citation source et rien n&rsquo;entre au
        dossier sans validation du praticien.
      </p>
      <div className="flex flex-col gap-2" style={{ marginBottom: 20 }}>
        {context.map((line) => (
          <div
            key={line}
            className="flex items-center gap-2.5 rounded-lg px-3.5"
            style={{ fontSize: 13, color: "#3A342A", background: "#FBF8F1", border: "1px solid #EFEADE", padding: "10px 14px" }}
          >
            <span style={{ color: "#2E6B4F", fontWeight: 600 }}>✓</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onGenerate}
        disabled={disabled}
        className="w-full rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50"
        style={{ background: "#2E6B4F", color: "#FFFDF9" }}
      >
        Analyser la consultation
      </button>
      {disabled ? (
        <p className="mt-2 text-center" style={{ fontSize: 12, color: "#9A9285" }}>
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
  const canGenerate = !loading && transcript.trim().length >= 20;

  return (
    <div className={`${serif.variable} ${sans.variable} flex h-full min-h-0 flex-col`}>
      <header
        className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b px-6 py-4"
        style={{ ...sansFont, background: "#FBF8F1", borderColor: "#E6DFD1" }}
      >
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-1.5 inline-block text-xs hover:text-[#2E6B4F]"
            style={{ color: "#8A8377" }}
          >
            ← Dossier
          </button>
          <h1 style={{ ...serifFont, fontSize: 29, lineHeight: 1.05, letterSpacing: "-0.01em", color: "#1C1B18" }}>
            Note de consultation
          </h1>
          <p style={{ fontSize: 13, color: "#8A8377", marginTop: 5 }}>
            {patientDossier.patient.prenom} {patientDossier.patient.nom} · {formatDate(sampleTranscript.date)} ·{" "}
            {notes ? "à vérifier avant de confirmer" : "à analyser"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {notes ? (
            <span
              className="rounded-full px-3 py-1.5 text-xs font-medium"
              style={{ background: "#E4EBE3", color: "#3D6047", border: "1px solid #D6E1D7" }}
            >
              {notes.used_llm ? "Généré par le modèle" : "Notes mockées (pas de clé API)"}
            </span>
          ) : null}
          <button
            type="button"
            disabled={!canGenerate}
            onClick={onGenerate}
            className="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{ background: "#2E6B4F", color: "#FFFDF9" }}
          >
            {loading ? "Génération…" : notes ? "Regénérer" : "Générer les notes"}
          </button>
          <button
            type="button"
            disabled={!notes || loading}
            onClick={onConfirm}
            className="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-40"
            style={{ background: "#FFFDF9", color: "#2E6B4F", border: "1px solid #2E6B4F" }}
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
            <div className="min-h-0 flex-1 overflow-y-auto">
              <GeneratePrompt onGenerate={onGenerate} disabled={!canGenerate} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
