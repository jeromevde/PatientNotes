"use client";

// Editable supplements, grouped by Arrêt / Ajout / Maintien.
// The section is the action — no dropdown, no drag. Search adds to Ajout.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ComplementCard,
  ComplementField,
  fieldBox,
  fieldBoxStyle,
} from "@/components/ComplementCard";
import { LabMark } from "@/components/LabMark";
import { formatPrice, productById, products } from "@/lib/data";
import { complementHighlight } from "@/lib/quotes";
import { scrollIfNeeded } from "@/lib/scroll";
import type { ComplementAction, ComplementRec } from "@/lib/types";

const groups: {
  action: ComplementAction;
  label: string;
  color: string;
  empty: string;
}[] = [
  {
    action: "arret",
    label: "Arrêt",
    color: "#B9752B",
    empty: "Aucun arrêt.",
  },
  {
    action: "ajout",
    label: "Ajout",
    color: "#2E6B4F",
    empty: "Aucun ajout.",
  },
  {
    action: "maintien",
    label: "Maintien",
    color: "#2E6B4F",
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
              className="text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ color: group.color }}
            >
              {group.label}
            </h3>
            {rows.length === 0 ? (
              <p className="mt-2 text-sm" style={{ color: "#9A9285" }}>
                {group.empty}
              </p>
            ) : (
              <ul className="mt-2 space-y-3">
                {rows.map((item) => (
                  <ComplementCard
                    key={item.produit_id}
                    produitId={item.produit_id}
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
                      <div className="flex flex-wrap items-center gap-3.5" style={{ fontSize: 12.5 }}>
                        <span style={{ color: "#2E6B4F", fontWeight: 600 }}>{actionLabel[item.action]}</span>
                        {otherActions[item.action].map((next) => (
                          <button
                            key={next}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPatch(item.produit_id, { action: next });
                            }}
                            style={{ color: "#9A9285" }}
                            className="hover:text-[#1C1B18]"
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
                          style={{ color: "#B9752B" }}
                          className="hover:text-[#8A5320]"
                        >
                          Retirer
                        </button>
                      </div>
                    }
                  >
                    <div
                      className="mt-3.5 grid gap-3 sm:grid-cols-2"
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
                          style={fieldBoxStyle}
                        />
                      </ComplementField>
                      <ComplementField label="Posologie">
                        <input
                          value={item.posologie ?? ""}
                          onChange={(e) =>
                            onPatch(item.produit_id, {
                              posologie: e.target.value || null,
                            })
                          }
                          placeholder="ex. 1 gélule matin"
                          className={fieldBox}
                          style={fieldBoxStyle}
                        />
                      </ComplementField>
                    </div>
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
    <div>
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
        placeholder="Ajouter un produit du catalogue…"
        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
        style={{ background: "#FFFDF9", border: "1px solid #E6DFD1", color: "#1C1B18" }}
      />
      {open ? (
        <ul
          className="mt-2 max-h-48 overflow-y-auto rounded-xl p-1.5"
          style={{ background: "#FFFDF9", border: "1px solid #E6DFD1" }}
        >
          {matches.length === 0 ? (
            <li className="px-2 py-2 text-sm" style={{ color: "#9A9285" }}>
              Aucun produit.
            </li>
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
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-[#F0F4EF]"
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
