// Shared cream product card: lab mark, name, price. Recs and notes both sit in this
// so a supplement looks like a supplement. Fields inside can differ.

import type { LiHTMLAttributes, ReactNode } from "react";
import { LabMark } from "@/components/LabMark";
import { formatPrice, productById } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const fieldBox =
  "mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink";

export function ComplementCard({
  produitId,
  depuis,
  leading,
  trailing,
  children,
  className,
  active = false,
  ...liProps
}: {
  produitId: string;
  depuis?: string | null;
  leading?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
  className?: string;
  active?: boolean;
} & Omit<LiHTMLAttributes<HTMLLIElement>, "children">) {
  const product = productById(produitId);
  const meta = [
    product ? formatPrice(product.prix) : "Hors catalogue",
    depuis ? `depuis ${formatDate(depuis)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      {...liProps}
      data-produit-id={produitId}
      className={`rounded-xl border border-line bg-card p-4 ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {leading}
          {product ? <LabMark lab={product.labo} /> : null}
          <div>
            <p
              className={
                active
                  ? "rounded-sm bg-mark-on px-0.5 text-sm font-medium text-card"
                  : "text-sm font-medium"
              }
            >
              {product?.nom ?? produitId}
            </p>
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
