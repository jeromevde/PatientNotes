"use client";

// One list: plan order, then new ajouts. Arrêt / Maintien / Ajout is a label
// on the card, inferred. Retirer on a plan product stops it in place; Remettre
// restores it. Retirer on an ajout drops the row. Search appends at the bottom.

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

const ACTION: Record<ComplementAction, { label: string; color: string }> = {
  arret: { label: "Arrêt", color: "var(--muted)" },
  maintien: { label: "Maintien", color: "var(--accent)" },
  ajout: { label: "Ajout", color: "var(--accent-2)" },
};

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

  const rows: { action: ComplementAction; item: ComplementRec; rec?: CurrentRec }[] = [
    ...currentRecs.map((rec) => {
      const item = items.find((i) => actionOnNote(i.produit_id, [rec]) === "maintien");
      if (item) return { action: "maintien" as const, item, rec };
      return {
        action: "arret" as const,
        item: {
          produit_id: rec.produit_id,
          posologie: rec.posologie,
          duree: null,
          quote: null,
        },
        rec,
      };
    }),
    ...items
      .filter((item) => actionOnNote(item.produit_id, currentRecs) === "ajout")
      .map((item) => ({ action: "ajout" as const, item })),
  ];

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
    <div ref={rootRef}>
      {rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map(({ action, item, rec }) => {
            const meta = ACTION[action];
            const isArret = action === "arret";
            return (
              <ComplementCard
                key={item.produit_id}
                produitId={item.produit_id}
                depuis={rec?.depuis}
                onClick={() =>
                  onFocusQuote(complementHighlight(transcript, item.produit_id))
                }
                active={
                  Boolean(focusQuote) &&
                  complementHighlight(transcript, item.produit_id) === focusQuote
                }
                title={
                  <p className="text-[15px] font-semibold" style={{ color: meta.color }}>
                    {meta.label}
                  </p>
                }
                trailing={
                  isArret ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdd(item.produit_id, rec);
                      }}
                      style={{ fontSize: 12.5, color: "var(--accent)" }}
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
                      style={{ fontSize: 12.5, color: "var(--muted)" }}
                      className="hover:underline"
                    >
                      Retirer
                    </button>
                  )
                }
              >
                <div
                  className="mt-3.5 grid gap-3 sm:grid-cols-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ComplementField label="Durée">
                    <input
                      value={item.duree ?? ""}
                      disabled={isArret}
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
                      disabled={isArret}
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
            );
          })}
        </ul>
      ) : null}
      <div className={rows.length > 0 ? "mt-4" : undefined}>
        <CatalogSearch takenIds={items.map((c) => c.produit_id)} onPick={pick} />
      </div>
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
        className="w-full px-4 py-3 text-sm outline-none"
        style={{
          background: "var(--paper)",
          color: "var(--ink)",
          borderRadius: "var(--radius)",
        }}
      />
      {open ? (
        <ul className="sc-card mt-2 max-h-48 overflow-y-auto p-1.5">
          {matches.length === 0 ? (
            <li className="px-2 py-2 text-sm" style={{ color: "var(--muted)" }}>
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
                  className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-sm hover:bg-paper"
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
