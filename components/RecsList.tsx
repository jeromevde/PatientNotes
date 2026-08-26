// Current supplements on the dossier. Same card as notes, but only posologie —
// no action / durée, those belong to a consultation draft.

import { ComplementCard, ComplementField, fieldBox } from "@/components/ComplementCard";

export function RecsList({
  items,
}: {
  items: { produit_id: string; posologie: string; depuis: string }[];
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <ComplementCard
          key={item.produit_id}
          produitId={item.produit_id}
          depuis={item.depuis}
        >
          <div className="mt-3">
            <ComplementField label="Posologie">
              <p className={`${fieldBox} min-h-[38px]`}>{item.posologie}</p>
            </ComplementField>
          </div>
        </ComplementCard>
      ))}
    </ul>
  );
}
