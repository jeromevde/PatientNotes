"use client";

// Editable supplements on a consultation note. Same cream card as dossier recs.
// Search the catalogue to add; same ingredient replaces the row; drag to reorder
// (other cards slide via the Web Animations API).

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
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

export function ComplementList({
  items,
  transcript,
  onPatch,
  onRemove,
  onAdd,
  onReorder,
  focusQuote,
  onFocusQuote,
}: {
  items: ComplementRec[];
  transcript: string;
  onPatch: (index: number, patch: Partial<ComplementRec>) => void;
  onRemove: (index: number) => void;
  onAdd: (produit_id: string) => void;
  onReorder: (items: ComplementRec[]) => void;
  focusQuote: string | null;
  onFocusQuote: (quote: string | null) => void;
}) {
  const grabIndex = useRef<number | null>(null);
  const draggingId = useRef<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    if (!focusQuote || !listRef.current) return;
    const id = items.find(
      (c) => complementHighlight(transcript, c.produit_id) === focusQuote,
    )?.produit_id;
    if (!id) return;
    const el = listRef.current.querySelector(`[data-produit-id="${id}"]`);
    const pane = listRef.current.closest("[data-notes-scroll]");
    if (el instanceof HTMLElement && pane instanceof HTMLElement) {
      scrollIfNeeded(el, pane);
    }
  }, [focusQuote, items, transcript]);

  function pick(produit_id: string) {
    const incoming = productById(produit_id);
    if (!incoming) return;
    const existing = items.findIndex(
      (item) => productById(item.produit_id)?.ingredient === incoming.ingredient,
    );
    if (existing >= 0) {
      onPatch(existing, { produit_id });
      return;
    }
    onAdd(produit_id);
  }

  function moveTo(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;
    const next = [...items];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);

    const root = listRef.current;
    const first = new Map<string, DOMRect>();
    if (root) {
      for (const node of root.children) {
        const el = node as HTMLElement;
        const id = el.dataset.produitId;
        if (id) first.set(id, el.getBoundingClientRect());
      }
    }

    flushSync(() => onReorder(next));

    if (!root) return;
    for (const node of root.children) {
      const el = node as HTMLElement;
      const id = el.dataset.produitId;
      if (!id || id === draggingId.current) continue;
      const before = first.get(id);
      if (!before) continue;
      const after = el.getBoundingClientRect();
      const dy = before.top - after.top;
      if (Math.abs(dy) < 1) continue;
      el.animate(
        [{ transform: `translateY(${dy}px)` }, { transform: "none" }],
        { duration: 180, easing: "ease-out" },
      );
    }
  }

  return (
    <div className="space-y-3">
      <CatalogSearch takenIds={items.map((c) => c.produit_id)} onPick={pick} />

      <ul ref={listRef} className="space-y-3">
        {items.map((item, i) => (
          <ComplementCard
            key={item.produit_id}
            produitId={item.produit_id}
            draggable
            onDragStart={(e) => {
              if (grabIndex.current !== i) {
                e.preventDefault();
                return;
              }
              draggingId.current = item.produit_id;
              setDragging(item.produit_id);
              e.dataTransfer.setData("text/plain", item.produit_id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              const from = items.findIndex(
                (row) => row.produit_id === draggingId.current,
              );
              moveTo(from, i);
            }}
            onDrop={(e) => e.preventDefault()}
            onDragEnd={() => {
              draggingId.current = null;
              grabIndex.current = null;
              setDragging(null);
            }}
            onClick={() =>
              onFocusQuote(complementHighlight(transcript, item.produit_id))
            }
            active={
              Boolean(focusQuote) &&
              complementHighlight(transcript, item.produit_id) === focusQuote
            }
            className={dragging === item.produit_id ? "opacity-40" : ""}
            leading={
              <button
                type="button"
                aria-label="Déplacer"
                className="cursor-grab text-muted hover:text-ink active:cursor-grabbing"
                onMouseDown={() => {
                  grabIndex.current = i;
                }}
              >
                ⠿
              </button>
            }
            trailing={
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-xs text-warn hover:underline"
              >
                Retirer
              </button>
            }
          >
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <ComplementField label="Action">
                <select
                  value={item.action}
                  onChange={(e) =>
                    onPatch(i, { action: e.target.value as ComplementAction })
                  }
                  className={fieldBox}
                >
                  <option value="ajout">Ajout</option>
                  <option value="maintien">Maintien</option>
                  <option value="arret">Arrêt</option>
                </select>
              </ComplementField>
              <ComplementField label="Durée">
                <input
                  value={item.duree ?? ""}
                  onChange={(e) => onPatch(i, { duree: e.target.value || null })}
                  placeholder="ex. 1 mois"
                  className={fieldBox}
                />
              </ComplementField>
              <ComplementField label="Posologie" className="sm:col-span-2">
                <input
                  value={item.posologie ?? ""}
                  onChange={(e) =>
                    onPatch(i, { posologie: e.target.value || null })
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
