"use client";

// Editable supplements. Arrêt / Ajout / Maintien is inferred from the current recs,
// never picked. Search adds a product to the note. Retirer drops it (a current rec
// then shows up under Arrêt). Remettre puts a stopped rec back on the note.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ComplementCard,
  ComplementField,
  fieldBox,
  fieldBoxStyle,
} from "@/components/ComplementCard";
import { LabMark } from "@/components/LabMark";
import { actionOnNote, stoppedRecs } from "@/lib/complements";
import { formatPrice, productById, products } from "@/lib/data";
import { complementHighlight } from "@/lib/quotes";
import { scrollIfNeeded } from "@/lib/scroll";
import type { ComplementAction, ComplementRec } from "@/lib/types";
import type { CurrentRec } from "@/lib/complements";

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
    action: "maintien",
    label: "Maintien",
    color: "#2E6B4F",
    empty: "Aucun maintien.",
  },
  {
    action: "ajout",
    label: "Ajout",
    color: "#2E6B4F",
    empty: "Aucun ajout.",
  },
];

export function ComplementList({
  items,
  currentRecs,
  transcript,
  onPatch,
  onRemove,
  onAdd,
  focusQuote,
  onFocusQuote,
}: {
  items: ComplementRec[];
  currentRecs: CurrentRec[];
  transcript: string;
  onPatch: (produit_id: string, patch: Partial<ComplementRec>) => void;
  onRemove: (produit_id: string) => void;
  onAdd: (produit_id: string, rec?: CurrentRec) => void;
  focusQuote: string | null;
  onFocusQuote: (quote: string | null) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stopped = stoppedRecs(currentRecs, items);
  const byAction: Record<ComplementAction, ComplementRec[]> = {
    arret: stopped.map((r) => ({
      produit_id: r.produit_id,
      posologie: r.posologie,
      duree: null,
      quote: null,
    })),
    ajout: items.filter((item) => actionOnNote(item.produit_id, currentRecs) === "ajout"),
    maintien: items.filter((item) => actionOnNote(item.produit_id, currentRecs) === "maintien"),
  };

  useEffect(() => {
    if (!focusQuote || !rootRef.current) return;
    const id = [...items, ...stopped].find(
      (c) => complementHighlight(transcript, c.produit_id) === focusQuote,
    )?.produit_id;
    if (!id) return;
    const el = rootRef.current.querySelector(`[data-produit-id="${id}"]`);
    const pane = rootRef.current.closest("[data-notes-scroll]");
    if (el instanceof HTMLElement && pane instanceof HTMLElement) {
      scrollIfNeeded(el, pane);
    }
  }, [focusQuote, items, transcript, stopped]);

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
    const rec = currentRecs.find((r) => r.produit_id === produit_id);
    onAdd(produit_id, rec);
  }

  return (
    <div ref={rootRef} className="space-y-6">
      {groups.map((group) => {
        const rows = byAction[group.action];
        const isArret = group.action === "arret";
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
                    depuis={
                      isArret
                        ? currentRecs.find((r) => r.produit_id === item.produit_id)?.depuis
                        : undefined
                    }
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
                      isArret ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rec = currentRecs.find(
                              (r) => r.produit_id === item.produit_id,
                            );
                            onAdd(item.produit_id, rec);
                          }}
                          style={{ fontSize: 12.5, color: "#2E6B4F" }}
                          className="hover:underline"
                        >
                          Remettre
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(item.produit_id);
                          }}
                          style={{ fontSize: 12.5, color: "#B9752B" }}
                          className="hover:text-[#8A5320]"
                        >
                          Retirer
                        </button>
                      )
                    }
                  >
                    {isArret ? null : (
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
                    )}
                  </ComplementCard>
                ))}
              </ul>
            )}
          </section>
        );
      })}
      <CatalogSearch takenIds={items.map((c) => c.produit_id)} onPick={pick} />
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
        placeholder="Ajouter un produit au catalogue…"
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
