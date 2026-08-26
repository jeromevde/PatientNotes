"use client";

// Editable supplements, grouped by Arrêt / Ajout / Maintien.
// The section is the action — no dropdown, no drag. Search adds to Ajout.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ComplementCard,
  ComplementField,
  fieldBox,
} from "@/components/ComplementCard";
import { LabMark } from "@/components/LabMark";
import { Quote } from "@/components/Quote";
import { formatPrice, productById, products } from "@/lib/data";
import { complementHighlight } from "@/lib/quotes";
import { scrollIfNeeded } from "@/lib/scroll";
import type { ComplementAction, ComplementRec } from "@/lib/types";

const groups: {
  action: ComplementAction;
  label: string;
  title: string;
  empty: string;
}[] = [
  {
    action: "arret",
    label: "Arrêt",
    title: "text-warn",
    empty: "Aucun arrêt.",
  },
  {
    action: "ajout",
    label: "Ajout",
    title: "text-accent",
    empty: "Aucun ajout.",
  },
  {
    action: "maintien",
    label: "Maintien",
    title: "text-keep",
    empty: "Aucun maintien.",
  },
];

const otherActions: Record<ComplementAction, ComplementAction[]> = {
  arret: ["ajout", "maintien"],
  ajout: ["arret", "maintien"],
  maintien: ["arret", "ajout"],
};

const actionLabel: Record<ComplementAction, string> = {
  arret: "Arrêt",
  ajout: "Ajout",
  maintien: "Maintien",
};

export function ComplementList({
  items,
  transcript,
  onPatch,
  onRemove,
  onAdd,
  focusQuote,
  onFocusQuote,
}: {
  items: ComplementRec[];
  transcript: string;
  onPatch: (produit_id: string, patch: Partial<ComplementRec>) => void;
  onRemove: (produit_id: string) => void;
  onAdd: (produit_id: string) => void;
  focusQuote: string | null;
  onFocusQuote: (quote: string | null) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusQuote || !rootRef.current) return;
    const id = items.find(
      (c) => complementHighlight(transcript, c.produit_id) === focusQuote,
    )?.produit_id;
    if (!id) return;
    const el = rootRef.current.querySelector(`[data-produit-id="${id}"]`);
    const pane = rootRef.current.closest("[data-notes-scroll]");
    if (el instanceof HTMLElement && pane instanceof HTMLElement) {
      scrollIfNeeded(el, pane);
    }
  }, [focusQuote, items, transcript]);

  function pick(produit_id: string) {
    const incoming = productById(produit_id);
    if (!incoming) return;
    const existing = items.find(
      (item) => productById(item.produit_id)?.ingredient === incoming.ingredient,
    );
    if (existing) {
      onPatch(existing.produit_id, { produit_id });
      return;
    }
    onAdd(produit_id);
  }

  return (
    <div ref={rootRef} className="space-y-6">
      <CatalogSearch takenIds={items.map((c) => c.produit_id)} onPick={pick} />

      {groups.map((group) => {
        const rows = items.filter((item) => item.action === group.action);
        return (
          <section key={group.action}>
            <h3
              className={`text-xs font-medium uppercase tracking-[0.14em] ${group.title}`}
            >
              {group.label}
            </h3>
            {rows.length === 0 ? (
              <p className="mt-2 text-sm text-muted">{group.empty}</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {rows.map((item) => (
                  <ComplementCard
                    key={item.produit_id}
                    produitId={item.produit_id}
                    tone={item.action}
                    onClick={() =>
                      onFocusQuote(
                        complementHighlight(transcript, item.produit_id),
                      )
                    }
                    active={
                      Boolean(focusQuote) &&
                      complementHighlight(transcript, item.produit_id) ===
                        focusQuote
                    }
                    trailing={
                      <div className="flex flex-wrap items-center gap-2">
                        {otherActions[item.action].map((next) => (
                          <button
                            key={next}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPatch(item.produit_id, { action: next });
                            }}
                            className="text-xs text-muted hover:text-ink hover:underline"
                          >
                            {actionLabel[next]}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(item.produit_id);
                          }}
                          className="text-xs text-warn hover:underline"
                        >
                          Retirer
                        </button>
                      </div>
                    }
                  >
                    <div
                      className="mt-3 grid gap-2 sm:grid-cols-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ComplementField label="Durée">
                        <input
                          value={item.duree ?? ""}
                          onChange={(e) =>
                            onPatch(item.produit_id, {
                              duree: e.target.value || null,
                            })
                          }
                          placeholder="ex. 1 mois"
                          className={fieldBox}
                        />
                      </ComplementField>
                      <ComplementField
                        label="Posologie"
                        className="sm:col-span-2"
                      >
                        <input
                          value={item.posologie ?? ""}
                          onChange={(e) =>
                            onPatch(item.produit_id, {
                              posologie: e.target.value || null,
                            })
                          }
                          placeholder="ex. 1 gélule matin"
                          className={fieldBox}
                        />
                      </ComplementField>
                    </div>
                    <Quote text={item.quote} />
                  </ComplementCard>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function CatalogSearch({
  takenIds,
  onPick,
}: {
  takenIds: string[];
  onPick: (produit_id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const taken = useMemo(() => new Set(takenIds), [takenIds]);

  const matches = products.filter((p) => {
    if (taken.has(p.id)) return false;
    const hay = `${p.nom} ${p.labo} ${p.categorie}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  return (
    <div className="rounded-xl border border-line bg-card p-3">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
        placeholder="Ajouter un produit…"
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
      />
      {open ? (
        <ul className="mt-2 max-h-48 overflow-y-auto">
          {matches.length === 0 ? (
            <li className="px-1 py-2 text-sm text-muted">Aucun produit.</li>
          ) : (
            matches.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick(p.id);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent-soft"
                >
                  <LabMark lab={p.labo} size={20} />
                  <span>
                    {p.nom} · {p.labo} · {formatPrice(p.prix)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
