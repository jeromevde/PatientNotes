"use client";

// Tabs for the five note sections. Only this file knows the notes shape.
// Complements use ComplementList (editable cousin of dossier RecsList).

import { useState } from "react";
import { ComplementList } from "@/components/ComplementList";
import { Quote } from "@/components/Quote";
import type { ComplementRec, ConsultationNotes } from "@/lib/types";

function QuotedField({
  value,
  onChange,
  quote,
  rows = 8,
}: {
  value: string;
  onChange: (v: string) => void;
  quote: string | null;
  rows?: number;
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full resize-y rounded-xl border border-line bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent"
      />
      <Quote text={quote} />
    </div>
  );
}

const tabs = [
  { id: "motif", label: "Motif" },
  { id: "anamnese", label: "Anamnèse" },
  { id: "complements", label: "Compléments" },
  { id: "hygiene", label: "Hygiène" },
  { id: "suivi", label: "Suivi" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function NotesEditor({
  notes,
  onChange,
}: {
  notes: ConsultationNotes;
  onChange: (notes: ConsultationNotes) => void;
}) {
  const [tab, setTab] = useState<TabId>("motif");

  function setComplements(complements: ComplementRec[]) {
    onChange({ ...notes, complements });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap gap-1 border-b border-line pb-2">
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
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

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pb-8">
        {tab === "motif" ? (
          <QuotedField
            value={notes.motif.text}
            quote={notes.motif.quote}
            onChange={(text) => onChange({ ...notes, motif: { ...notes.motif, text } })}
          />
        ) : null}

        {tab === "anamnese" ? (
          <QuotedField
            value={notes.anamnese.text}
            quote={notes.anamnese.quote}
            rows={10}
            onChange={(text) =>
              onChange({ ...notes, anamnese: { ...notes.anamnese, text } })
            }
          />
        ) : null}

        {tab === "complements" ? (
          <ComplementList
            items={notes.complements}
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
            onSwap={(index, produit_id) =>
              setComplements(
                notes.complements.map((item, i) =>
                  i === index ? { ...item, produit_id } : item,
                ),
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
          />
        ) : null}

        {tab === "hygiene" ? (
          <QuotedField
            value={notes.hygiene_de_vie.text}
            quote={notes.hygiene_de_vie.quote}
            onChange={(text) =>
              onChange({
                ...notes,
                hygiene_de_vie: { ...notes.hygiene_de_vie, text },
              })
            }
          />
        ) : null}

        {tab === "suivi" ? (
          <QuotedField
            value={notes.suivi.text}
            quote={notes.suivi.quote}
            onChange={(text) =>
              onChange({ ...notes, suivi: { ...notes.suivi, text } })
            }
          />
        ) : null}
      </div>
    </div>
  );
}
