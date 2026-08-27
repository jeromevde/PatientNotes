// Shared cream product card: lab mark, name, price. Recs and notes both sit in this
// so a supplement looks like a supplement. Fields inside can differ.

import type { LiHTMLAttributes, ReactNode } from "react";
import { LabMark } from "@/components/LabMark";
import { formatPrice, productById } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const fieldBox = "mt-1.5 w-full rounded-lg px-3 py-2 text-sm outline-none";
export const fieldBoxStyle = { background: "#FBF8F1", border: "1px solid #E6DFD1", color: "#1C1B18" };

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
    product ? `${formatPrice(product.prix)} / mois` : "Hors catalogue",
    depuis ? `depuis ${formatDate(depuis)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      {...liProps}
      data-produit-id={produitId}
      className={`rounded-2xl p-4 ${className ?? ""}`}
      style={{ background: "#FFFDF9", border: "1px solid #E6DFD1" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {leading}
          {product ? <LabMark lab={product.labo} /> : null}
          <div>
            <p
              className={
                active
                  ? "quote-paint w-fit bg-mark text-sm font-semibold leading-relaxed underline decoration-2 underline-offset-4 decoration-accent"
                  : "text-sm font-semibold leading-relaxed"
              }
              style={{ color: "#1C1B18" }}
            >
              {product?.nom ?? produitId}
            </p>
            <p style={{ fontSize: 12.5, color: "#9A9285" }}>{meta}</p>
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
    <label className={className} style={{ fontSize: 12, color: "#8A8377" }}>
      {label}
      {children}
    </label>
  );
}
