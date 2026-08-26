"use client";

// Tabs for the five note sections. Only this file knows the notes shape.
// Complements use ComplementList (editable cousin of dossier RecsList).

import { useEffect, useLayoutEffect, useRef } from "react";
import { ComplementList } from "@/components/ComplementList";
import type { NoteTab } from "@/lib/quotes";
import { scrollIfNeeded } from "@/lib/scroll";
import type { Claim, ComplementRec, ConsultationNotes } from "@/lib/types";

function ClaimList({
  items,
  onChange,
  focusQuote,
  onFocusQuote,
}: {
  items: Claim[];
  onChange: (items: Claim[]) => void;
  focusQuote: string | null;
  onFocusQuote: (quote: string | null) => void;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const focusAt = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (focusAt.current == null) return;
    inputs.current[focusAt.current]?.focus();
    focusAt.current = null;
  });

  useEffect(() => {
    if (!focusQuote) return;
    const i = items.findIndex((c) => c.quote === focusQuote);
    const el = inputs.current[i];
    if (!el) return;
    const pane = el.closest("[data-notes-scroll]");
    if (pane instanceof HTMLElement) scrollIfNeeded(el, pane);
  }, [focusQuote, items]);

  const last = items.length;

  function go(to: number, caret: number | "end") {
    const el = inputs.current[to];
    if (!el) return;
    el.focus();
    const pos = caret === "end" ? el.value.length : Math.min(caret, el.value.length);
    el.setSelectionRange(pos, pos);
  }

  return (
    <div>
      {Array.from({ length: items.length + 1 }, (_, i) => {
        const item = items[i] ?? { text: "", quote: null };
        const isAdd = i === items.length;
        const on = Boolean(focusQuote) && item.quote === focusQuote;
        return (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={item.text}
            aria-label={isAdd ? "Ajouter un fait" : "Fait"}
            onFocus={() => onFocusQuote(item.quote)}
            onChange={(e) => {
              const text = e.target.value;
              if (isAdd) {
                if (!text) return;
                onChange([...items, { text, quote: null }]);
                return;
              }
              onChange(
                items.map((c, j) => (j === i ? { ...c, text } : c)),
              );
            }}
            onKeyDown={(e) => {
              const caret = e.currentTarget.selectionStart ?? 0;
              const end = e.currentTarget.selectionEnd ?? 0;
              const atStart = caret === 0 && end === 0;
              const atEnd = caret === end && caret === e.currentTarget.value.length;

              if (e.key === "ArrowDown" && i < last) {
                e.preventDefault();
                go(i + 1, caret);
                return;
              }
              if (e.key === "ArrowUp" && i > 0) {
                e.preventDefault();
                go(i - 1, caret);
                return;
              }
              if (e.key === "ArrowLeft" && atStart && i > 0) {
                e.preventDefault();
                go(i - 1, "end");
                return;
              }
              if (e.key === "ArrowRight" && atEnd && i < last) {
                e.preventDefault();
                go(i + 1, 0);
                return;
              }
              if (e.key === "Enter") {
                e.preventDefault();
                if (isAdd) return;
                if (i === items.length - 1) {
                  go(items.length, 0);
                  return;
                }
                onChange([
                  ...items.slice(0, i + 1),
                  { text: "", quote: null },
                  ...items.slice(i + 1),
                ]);
                focusAt.current = i + 1;
                return;
              }
              if (e.key === "Backspace" && !isAdd && item.text === "") {
                e.preventDefault();
                onChange(items.filter((_, j) => j !== i));
                focusAt.current = Math.max(0, i - 1);
              }
            }}
            className={`block w-full rounded-sm px-0.5 py-1.5 text-sm leading-relaxed outline-none ${
              on ? "bg-mark-on text-card" : "bg-transparent"
            }`}
          />
        );
      })}
    </div>
  );
}

export const noteTabs: { id: NoteTab; label: string }[] = [
  { id: "motif", label: "Motif" },
  { id: "anamnese", label: "Anamnèse" },
  { id: "complements", label: "Compléments" },
  { id: "hygiene", label: "Hygiène" },
  { id: "suivi", label: "Suivi" },
];

export function NotesEditor({
  notes,
  transcript,
  onChange,
  tab,
  onTabChange,
  focusQuote,
  onFocusQuote,
}: {
  notes: ConsultationNotes;
  transcript: string;
  onChange: (notes: ConsultationNotes) => void;
  tab: NoteTab;
  onTabChange: (tab: NoteTab) => void;
  focusQuote: string | null;
  onFocusQuote: (quote: string | null) => void;
}) {

  function setComplements(complements: ComplementRec[]) {
    onChange({ ...notes, complements });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap gap-1 border-b border-line pb-2">
        {noteTabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                active
                  ? "bg-accent text-white"
                  : "bg-transparent text-muted hover:bg-accent-soft hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div data-notes-scroll className="mt-4 min-h-0 flex-1 overflow-y-auto pb-8">
        {tab === "motif" ? (
          <ClaimList
            items={notes.motif}
            onChange={(motif) => onChange({ ...notes, motif })}
            focusQuote={focusQuote}
            onFocusQuote={onFocusQuote}
          />
        ) : null}

        {tab === "anamnese" ? (
          <ClaimList
            items={notes.anamnese}
            onChange={(anamnese) => onChange({ ...notes, anamnese })}
            focusQuote={focusQuote}
            onFocusQuote={onFocusQuote}
          />
        ) : null}

        {tab === "complements" ? (
          <ComplementList
            items={notes.complements}
            transcript={transcript}
            onPatch={(index, patch) =>
              setComplements(
                notes.complements.map((item, i) =>
                  i === index ? { ...item, ...patch } : item,
                ),
              )
            }
            onRemove={(index) =>
              setComplements(notes.complements.filter((_, i) => i !== index))
            }
            onReorder={setComplements}
            onAdd={(produit_id) =>
              setComplements([
                ...notes.complements,
                {
                  produit_id,
                  action: "ajout",
                  posologie: null,
                  duree: null,
                  quote: null,
                },
              ])
            }
            focusQuote={focusQuote}
            onFocusQuote={onFocusQuote}
          />
        ) : null}

        {tab === "hygiene" ? (
          <ClaimList
            items={notes.hygiene_de_vie}
            onChange={(hygiene_de_vie) => onChange({ ...notes, hygiene_de_vie })}
            focusQuote={focusQuote}
            onFocusQuote={onFocusQuote}
          />
        ) : null}

        {tab === "suivi" ? (
          <ClaimList
            items={notes.suivi}
            onChange={(suivi) => onChange({ ...notes, suivi })}
            focusQuote={focusQuote}
            onFocusQuote={onFocusQuote}
          />
        ) : null}
      </div>
    </div>
  );
}
