// Arrêt / Ajout / Maintien is a set difference, not a choice.
// Same molecule as a current rec → maintien (adding a stopped one back is keep,
// even via another lab). New molecule → ajout. Current rec whose molecule is
// gone from the note → arrêt.

import { productById } from "./data";

export type CurrentRec = {
  produit_id: string;
  posologie: string;
  depuis: string;
};

function molecule(produit_id: string): string {
  return productById(produit_id)?.ingredient ?? produit_id;
}

export function actionOnNote(
  produit_id: string,
  recs: { produit_id: string }[],
): "ajout" | "maintien" {
  const current = new Set(recs.map((r) => molecule(r.produit_id)));
  return current.has(molecule(produit_id)) ? "maintien" : "ajout";
}

export function stoppedRecs<T extends { produit_id: string }>(
  recs: T[],
  noteItems: { produit_id: string }[],
): T[] {
  const onNote = new Set(noteItems.map((c) => molecule(c.produit_id)));
  return recs.filter((r) => !onNote.has(molecule(r.produit_id)));
}

/** Apply a confirmed note onto the current plan. Arrêt drops a rec, maintien
 *  keeps depuis and takes the note posologie, ajout is appended with aujourd'hui. */
export function planAfterNote(
  recs: CurrentRec[],
  noteItems: { produit_id: string; posologie: string | null }[],
  aujourdHui: string,
): CurrentRec[] {
  const byMol = new Map(noteItems.map((item) => [molecule(item.produit_id), item]));
  const kept: CurrentRec[] = [];
  const seen = new Set<string>();
  for (const rec of recs) {
    const mol = molecule(rec.produit_id);
    const item = byMol.get(mol);
    if (!item) continue;
    seen.add(mol);
    kept.push({
      produit_id: item.produit_id,
      posologie: item.posologie ?? rec.posologie,
      depuis: rec.depuis,
    });
  }
  const added = noteItems
    .filter((item) => !seen.has(molecule(item.produit_id)))
    .map((item) => ({
      produit_id: item.produit_id,
      posologie: item.posologie ?? "",
      depuis: aujourdHui,
    }));
  return [...kept, ...added];
}
