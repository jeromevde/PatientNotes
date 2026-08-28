// Shared product card: lab mark, name, price. Recs and notes both sit in this
// so a supplement looks like a supplement. Fields inside can differ.

import type { LiHTMLAttributes, ReactNode } from "react";
import { LabMark } from "@/components/LabMark";
import { formatPrice, productById } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const fieldBox = "mt-1.5 w-full px-3 py-2 text-sm outline-none";
export const fieldBoxStyle = {
  background: "var(--paper)",
  color: "var(--ink)",
  borderRadius: "var(--radius)",
};

export function ComplementCard({
  produitId,
  depuis,
  title,
  leading,
  trailing,
  children,
  className,
  active = false,
  ...liProps
}: {
  produitId: string;
  depuis?: string | null;
  title?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
  className?: string;
  active?: boolean;
} & Omit<LiHTMLAttributes<HTMLLIElement>, "children" | "title">) {
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
      className={`sc-card p-4 ${className ?? ""}`}
    >
      {title || trailing ? (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          {title}
          {trailing}
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        {leading}
        {product ? <LabMark lab={product.labo} /> : null}
        <div>
          <p
            className={
              active
                ? "quote-paint w-fit bg-mark text-sm font-semibold leading-relaxed underline decoration-2 decoration-accent"
                : "text-sm font-semibold leading-relaxed"
            }
            style={{ color: "var(--ink)" }}
          >
            {product?.nom ?? produitId}
          </p>
          <p className="text-[12.5px]" style={{ color: "var(--muted)" }}>{meta}</p>
        </div>
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
    <label className={className} style={{ fontSize: 12, color: "var(--muted)" }}>
      {label}
      {children}
    </label>
  );
}
