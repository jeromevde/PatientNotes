// Shared cream product card: lab mark, name, price. Recs and notes both sit in this
// so a supplement looks like a supplement. Fields inside can differ.

import type { LiHTMLAttributes, ReactNode } from "react";
import { LabMark } from "@/components/LabMark";
import { formatPrice, productById } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const fieldBox =
  "mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink";

const toneEdge = {
  ajout: "border-l-accent",
  maintien: "border-l-keep",
  arret: "border-l-warn",
};

export function ComplementCard({
  produitId,
  depuis,
  leading,
  trailing,
  children,
  className,
  active = false,
  tone,
  ...liProps
}: {
  produitId: string;
  depuis?: string | null;
  leading?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
  className?: string;
  active?: boolean;
  tone?: "ajout" | "maintien" | "arret";
} & Omit<LiHTMLAttributes<HTMLLIElement>, "children">) {
  const product = productById(produitId);
  const meta = [
    product ? formatPrice(product.prix) : "Hors catalogue",
    depuis ? `depuis ${formatDate(depuis)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const edge = tone ? `border-l-[3px] ${toneEdge[tone]}` : "";

  return (
    <li
      {...liProps}
      data-produit-id={produitId}
      className={`rounded-xl border border-line bg-card p-4 ${edge} ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {leading}
          {product ? <LabMark lab={product.labo} /> : null}
          <div>
            <p
              className={
                active
                  ? "quote-paint w-fit bg-mark-on text-sm font-medium leading-relaxed text-card"
                  : "text-sm font-medium leading-relaxed"
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
