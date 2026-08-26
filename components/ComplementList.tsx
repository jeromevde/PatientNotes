"use client";

// Editable supplements on a consultation note. Same cream card as dossier recs;
// extra fields (action, durée, swap, add) live only here.

import { useState } from "react";
import {
  ComplementCard,
  ComplementField,
  fieldBox,
} from "@/components/ComplementCard";
import { LabMark } from "@/components/LabMark";
import { Quote } from "@/components/Quote";
import { alternatives, formatPrice, unusedIngredients } from "@/lib/data";
import type { ComplementAction, ComplementRec } from "@/lib/types";

export function ComplementList({
  items,
  onPatch,
  onRemove,
  onAdd,
  onSwap,
}: {
  items: ComplementRec[];
  onPatch: (index: number, patch: Partial<ComplementRec>) => void;
  onRemove: (index: number) => void;
  onAdd: (produit_id: string) => void;
  onSwap: (index: number, produit_id: string) => void;
}) {
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {items.map((item, i) => (
          <ComplementCard
            key={`${item.produit_id}-${i}`}
            produitId={item.produit_id}
            trailing={
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-xs text-warn hover:underline"
              >
                Supprimer
              </button>
            }
          >
            <NoteFields
              item={item}
              swapping={swapIndex === i}
              onToggleSwap={() => setSwapIndex(swapIndex === i ? null : i)}
              onSwap={(id) => {
                onSwap(i, id);
                setSwapIndex(null);
              }}
              onPatch={(patch) => onPatch(i, patch)}
            />
          </ComplementCard>
        ))}
      </ul>

      {adding ? (
        <div className="rounded-xl border border-dashed border-line bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Ajouter depuis le catalogue
          </p>
          <ul className="mt-2 space-y-1">
            {unusedIngredients(items.map((c) => c.produit_id)).length === 0 ? (
              <li className="text-sm text-muted">
                Rien à ajouter — tout le catalogue est déjà là.
              </li>
            ) : (
              unusedIngredients(items.map((c) => c.produit_id)).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onAdd(p.id);
                      setAdding(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-left text-sm hover:border-accent"
                  >
                    <LabMark lab={p.labo} size={20} />
                    {p.nom} · {formatPrice(p.prix)}
                  </button>
                </li>
              ))
            )}
          </ul>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="mt-2 text-xs text-muted hover:underline"
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-sm font-medium text-accent hover:underline"
        >
          + Ajouter un complément
        </button>
      )}
    </div>
  );
}

function NoteFields({
  item,
  swapping,
  onToggleSwap,
  onSwap,
  onPatch,
}: {
  item: ComplementRec;
  swapping: boolean;
  onToggleSwap: () => void;
  onSwap: (produit_id: string) => void;
  onPatch: (patch: Partial<ComplementRec>) => void;
}) {
  const alts = alternatives(item.produit_id);

  return (
    <>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ComplementField label="Action">
          <select
            value={item.action}
            onChange={(e) =>
              onPatch({ action: e.target.value as ComplementAction })
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
            onChange={(e) => onPatch({ duree: e.target.value || null })}
            placeholder="ex. 1 mois"
            className={fieldBox}
          />
        </ComplementField>
        <ComplementField label="Posologie" className="sm:col-span-2">
          <input
            value={item.posologie ?? ""}
            onChange={(e) => onPatch({ posologie: e.target.value || null })}
            placeholder="ex. 1 gélule matin"
            className={fieldBox}
          />
        </ComplementField>
      </div>

      <Quote text={item.quote} />

      {alts.length > 0 ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={onToggleSwap}
            className="text-xs font-medium text-accent hover:underline"
          >
            {swapping ? "Fermer" : "Changer de laboratoire"}
          </button>
          {swapping ? (
            <ul className="mt-2 space-y-1">
              {alts.map((alt) => (
                <li key={alt.id}>
                  <button
                    type="button"
                    onClick={() => onSwap(alt.id)}
                    className="flex w-full items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-left text-sm hover:border-accent"
                  >
                    <LabMark lab={alt.labo} size={20} />
                    {alt.nom} · {formatPrice(alt.prix)}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
