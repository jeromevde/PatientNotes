"use client";

// Tabs for the five note sections. Only this file knows the notes shape.
// Complements use ComplementList, grouped by Arrêt / Ajout / Maintien.

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
          <div key={i} className="py-1.5">
            <div className="relative inline-grid max-w-full">
              <span
                aria-hidden
                className="pointer-events-none invisible col-start-1 row-start-1 whitespace-pre pr-1 text-sm leading-relaxed"
              >
                {item.text || (isAdd ? "Ajouter un fait…" : " ")}
              </span>
            <input
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
              placeholder={isAdd ? "Ajouter un fait…" : undefined}
              className={`quote-paint col-start-1 row-start-1 m-0 min-w-0 w-full border-0 p-0 text-sm leading-relaxed outline-none text-ink ${
                on ? "bg-mark underline decoration-2 underline-offset-4 decoration-accent" : "bg-transparent"
              }`}
            />
            </div>
          </div>
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

  const tabCounts: Record<NoteTab, number> = {
    motif: notes.motif.length,
    anamnese: notes.anamnese.length,
    complements: notes.complements.length,
    hygiene: notes.hygiene_de_vie.length,
    suivi: notes.suivi.length,
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      style={{ fontFamily: "var(--font-notetaker-sans), Helvetica, Arial, sans-serif" }}
    >
      <div className="flex flex-wrap gap-1 pb-3" style={{ borderBottom: "1px solid #E6DFD1" }}>
        {noteTabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium"
              style={
                active
                  ? { background: "#2E6B4F", color: "#FFFDF9" }
                  : { background: "transparent", color: "#3A342A" }
              }
            >
              {t.label}
              <span style={{ fontSize: 11.5, color: active ? "rgba(255,253,249,0.75)" : "#9A9285" }}>
                {tabCounts[t.id]}
              </span>
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
            onPatch={(produit_id, patch) =>
              setComplements(
                notes.complements.map((item) =>
                  item.produit_id === produit_id ? { ...item, ...patch } : item,
                ),
              )
            }
            onRemove={(produit_id) =>
              setComplements(
                notes.complements.filter((item) => item.produit_id !== produit_id),
              )
            }
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
