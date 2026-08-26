// Shared cream product card: lab mark, name, price. Recs and notes both sit in this
// so a supplement looks like a supplement. Fields inside can differ.

import type { ReactNode } from "react";
import { LabMark } from "@/components/LabMark";
import { formatPrice, productById } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const fieldBox =
  "mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink";

export function ComplementCard({
  produitId,
  depuis,
  trailing,
  children,
}: {
  produitId: string;
  depuis?: string | null;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  const product = productById(produitId);
  const meta = [
    product ? formatPrice(product.prix) : "Hors catalogue",
    depuis ? `depuis ${formatDate(depuis)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="rounded-xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {product ? <LabMark lab={product.labo} /> : null}
          <div>
            <p className="text-sm font-medium">{product?.nom ?? produitId}</p>
            <p className="text-xs text-muted">{meta}</p>
          </div>
        </div>
        {trailing}
      </div>
      {children}
    </li>
  );
}

export function ComplementField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`text-xs text-muted ${className ?? ""}`}>
      {label}
      {children}
    </label>
  );
}
