// Patient dossier screen: identity, current plan, biomarkers, case timeline.
// Fonts and colors come from the app shell. Does not edit the patient.
// Shows an attached note after Confirm.

"use client";

import type { CSSProperties } from "react";
import { LabMark } from "@/components/LabMark";
import { actionOnNote } from "@/lib/complements";
import { patientDossier, productById, formatPrice } from "@/lib/data";
import { ageYears, formatDate } from "@/lib/format";
import type { BiomarkerStatus, ConsultationNotes, PatientDossier } from "@/lib/types";

const SECTION: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "var(--ink)",
};

const BIO_STYLE: Record<BiomarkerStatus, { label: string; bg: string; fg: string }> = {
  bas: { label: "Bas", bg: "var(--paper)", fg: "var(--muted)" },
  haut: { label: "Haut", bg: "var(--paper)", fg: "var(--muted)" },
  normal: { label: "Normal", bg: "var(--paper)", fg: "var(--accent)" },
};

const RANGE_PAD = 16;

function parseRef(ref: string): { lo: number; hi: number } {
  const [lo, hi] = ref.split("-").map((s) => parseFloat(s.trim()));
  return { lo, hi };
}

function pct(lo: number, hi: number, v: number): number {
  const pad = RANGE_PAD / 100;
  const t = (v - lo) / (hi - lo);
  return Math.max(0, Math.min(100, (pad + t * (1 - 2 * pad)) * 100));
}

const fr = (n: number) => String(n).replace(".", ",");

type TimelineEntry =
  | { kind: "consultation"; id: string; date: string; motif: string }
  | { kind: "biologie"; date: string; items: PatientDossier["biomarqueurs_recents"] }
  | { kind: "ouverture"; date: string };

export function DossierView({
  attachedNotes,
  onStartNote,
}: {
  attachedNotes: ConsultationNotes | null;
  onStartNote: () => void;
}) {
  const { patient, historique_consultations, recommandations_en_cours, biomarqueurs_recents } =
    patientDossier;
  const latest = historique_consultations[historique_consultations.length - 1];

  const bioByDate = new Map<string, typeof biomarqueurs_recents>();
  for (const b of biomarqueurs_recents) {
    bioByDate.set(b.date, [...(bioByDate.get(b.date) ?? []), b]);
  }
  const timeline: TimelineEntry[] = [
    ...historique_consultations.map(
      (c): TimelineEntry => ({ kind: "consultation", id: c.id, date: c.date, motif: c.motif }),
    ),
    ...[...bioByDate.entries()].map(([date, items]): TimelineEntry => ({ kind: "biologie", date, items })),
    { kind: "ouverture" as const, date: patient.cree_le },
  ].sort((a, b) => b.date.localeCompare(a.date));

  const planItems = recommandations_en_cours
    .map((r) => ({ ...r, product: productById(r.produit_id) }))
    .filter((r) => r.product);
  const planTotal = planItems.reduce((sum, r) => sum + (r.product?.prix ?? 0), 0);

  const latestBioDate = biomarqueurs_recents.reduce(
    (max, b) => (b.date > max ? b.date : max),
    biomarqueurs_recents[0]?.date ?? "",
  );
  const problematicBio = biomarqueurs_recents.filter((b) => b.statut !== "normal");
  const normalBio = biomarqueurs_recents.filter((b) => b.statut === "normal");

  return (
    <div className="min-h-full" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      <header
        className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-6 py-3"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
            style={{ background: "var(--accent)", color: "var(--card)" }}
            style={{ background: "var(--accent)" }}
            aria-hidden
          >
            S
          </div>
          <span className="text-[15px] font-medium">Simplycure</span>
        </div>
      </header>

      <div className="mx-auto px-5 py-8" style={{ maxWidth: 1100 }}>
        <section className="sc-card p-6">
          <h1 className="text-[28px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
            {patient.prenom} {patient.nom}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px]" style={{ color: "var(--muted)" }}>
            <span>
              {ageYears(patient.date_naissance)} ans · {patient.sexe === "F" ? "Femme" : "Homme"} · née le{" "}
              {formatDate(patient.date_naissance)}
            </span>
            <span style={{ color: "var(--line)" }}>|</span>
            <span>{patient.email}</span>
          </div>
        </section>

        <div style={{ height: 24 }} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
          <div className="flex flex-col gap-6">
            <div>
              <div className="mb-3" style={SECTION}>
                Plan en cours
              </div>
              {planItems.length > 0 ? (
                <div className="sc-card overflow-hidden">
                  {planItems.map((item, i) => (
                    <div
                      key={item.produit_id}
                      className="grid items-start gap-4 p-5 max-sm:grid-cols-1 sm:grid-cols-[1fr_auto]"
                      style={{
                        borderBottom: i < planItems.length - 1 ? "1px solid var(--line)" : "none",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {item.product ? <LabMark lab={item.product.labo} size={28} /> : null}
                        <div>
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <span className="text-[15px] font-semibold">{item.product?.nom}</span>
                            <span className="text-[12.5px]" style={{ color: "var(--muted)" }}>{item.product?.labo}</span>
                          </div>
                          <span className="sc-pill">{item.posologie}</span>
                          <div className="mt-2 text-[12.5px]" style={{ color: "var(--muted)" }}>
                            Depuis le {formatDate(item.depuis)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right max-sm:text-left">
                        <div className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                          {item.product ? formatPrice(item.product.prix) : ""}
                        </div>
                        <div className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>boîte / mois</div>
                      </div>
                    </div>
                  ))}
                  <div
                    className="flex items-center justify-between px-5 py-3.5"
                    style={{ background: "var(--paper)", borderTop: "1px solid var(--line)" }}
                  >
                    <div className="text-[13px]" style={{ color: "var(--muted)" }}>Coût mensuel du protocole</div>
                    <div className="text-[15px] font-medium" style={{ color: "var(--accent)" }}>{formatPrice(planTotal)}</div>
                  </div>
                </div>
              ) : (
                <div className="sc-card px-6 py-8 text-center">
                  <div className="mb-1.5 text-lg font-semibold">Aucune recommandation en cours</div>
                  <p className="mx-auto mb-4 max-w-md text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
                    La première note de consultation crée le plan.
                  </p>
                  <button type="button" onClick={onStartNote} className="btn btn-primary">
                    Démarrer une consultation
                  </button>
                </div>
              )}
            </div>

            <div>
              <div className="mb-3" style={SECTION}>
                Biomarqueurs récents{latestBioDate ? ` · bilan du ${formatDate(latestBioDate)}` : ""}
              </div>
              {biomarqueurs_recents.length > 0 ? (
                <div className="sc-card">
                  {problematicBio.length === 0 ? (
                    <div className="px-5 py-4 text-[13px]" style={{ color: "var(--muted)" }}>
                      Aucune valeur hors norme. {biomarqueurs_recents.length} valeur(s) dans les normes.
                    </div>
                  ) : null}
                  {problematicBio.map((b, i) => {
                    const { lo, hi } = parseRef(b.ref);
                    const sty = BIO_STYLE[b.statut];
                    return (
                      <div
                        key={b.nom}
                        className="grid items-center gap-3.5 px-5 py-3 max-sm:grid-cols-1 sm:grid-cols-[minmax(0,1.35fr)_130px_152px]"
                        style={{
                          borderTop: i === 0 ? "none" : "1px solid var(--line)",
                        }}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{b.nom}</div>
                          <div className="text-xs" style={{ color: "var(--muted)" }}>réf. {b.ref} {b.unite}</div>
                        </div>
                        <div
                          className="relative h-1.5 rounded-full"
                          style={{
                            background: `linear-gradient(to right, var(--line) ${RANGE_PAD}%, var(--accent-2) ${RANGE_PAD}%, var(--accent-2) ${100 - RANGE_PAD}%, var(--line) ${100 - RANGE_PAD}%)`,
                          }}
                        >
                          <div
                            className="absolute"
                            style={{
                              top: "50%",
                              left: `clamp(6px, ${pct(lo, hi, b.valeur)}%, calc(100% - 6px))`,
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              border: "2px solid var(--accent-2)",
                              background: "var(--card)",
                              transform: "translate(-50%, -50%)",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2.5">
                          <span className="whitespace-nowrap text-[13px] font-medium">
                            {fr(b.valeur)} {b.unite}
                          </span>
                          <span
                            className="sc-pill whitespace-nowrap"
                            style={{ background: sty.bg, color: sty.fg, fontWeight: 600 }}
                          >
                            {sty.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {normalBio.length > 0 ? (
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                      style={{ borderTop: "1px solid var(--line)" }}
                    >
                      <span className="text-[12.5px]" style={{ color: "var(--muted)" }}>
                        {normalBio.length} autre{normalBio.length > 1 ? "s" : ""} valeur
                        {normalBio.length > 1 ? "s" : ""} dans les normes
                      </span>
                      <button
                        type="button"
                        disabled
                        className="text-[13px] font-medium"
                        style={{ color: "var(--accent)", background: "none", opacity: 1, cursor: "not-allowed" }}
                      >
                        Ouvrir le comparateur de bilan →
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="sc-card px-6 py-8 text-center">
                  <div className="mb-1.5 text-lg font-semibold">Aucun bilan au dossier</div>
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
                    Aucun biomarqueur n&rsquo;est encore enregistré.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-3" style={SECTION}>
              Fil du dossier
            </div>
            <div className="sc-card px-5 pb-4 pt-4">
              <button type="button" onClick={onStartNote} className="btn btn-primary mb-4 w-full">
                + Nouvelle consultation
              </button>

              {timeline.map((entry, i) => {
                const isLast = i === timeline.length - 1;
                const isLatestConsultation = entry.kind === "consultation" && entry.id === latest.id;
                const isConfirmed = isLatestConsultation && Boolean(attachedNotes);
                const accent = entry.kind === "biologie" ? "var(--muted)" : isConfirmed ? "var(--accent)" : "var(--line)";
                const typeLabel =
                  entry.kind === "biologie" ? "Biologie" : entry.kind === "ouverture" ? "Ouverture du dossier" : "Consultation";
                const key = entry.kind === "biologie" ? `bio-${entry.date}` : entry.kind === "ouverture" ? "ouverture" : entry.id;
                return (
                  <div
                    key={key}
                    className="grid items-stretch gap-3 py-3.5"
                    style={{
                      gridTemplateColumns: "14px 1fr",
                      borderBottom: isLast ? "none" : "1px solid var(--line)",
                    }}
                  >
                    <div className="flex flex-col items-center pt-1.5">
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: accent,
                          flex: "none",
                        }}
                      />
                      {!isLast ? <div style={{ width: 1, flex: 1, background: "var(--line)", marginTop: 5 }} /> : null}
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-medium" style={{ color: "var(--muted)" }}>
                        {formatDate(entry.date)} · {typeLabel}
                      </div>

                      {entry.kind === "biologie" ? (
                        (() => {
                          const abnormal = entry.items.filter((b) => b.statut !== "normal");
                          const shown = abnormal.length > 0 ? abnormal : entry.items;
                          const restCount = entry.items.length - shown.length;
                          return (
                            <>
                              <div className="text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                                {shown.map((b) => `${b.nom} ${fr(b.valeur)} ${b.unite}`).join(" · ")}
                              </div>
                              {restCount > 0 ? (
                                <div className="mt-0.5 text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                                  + {restCount} autre{restCount > 1 ? "s" : ""} valeur{restCount > 1 ? "s" : ""} dans les normes
                                </div>
                              ) : null}
                            </>
                          );
                        })()
                      ) : entry.kind === "consultation" ? (
                        <div className="text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>{entry.motif}</div>
                      ) : null}

                      {isConfirmed && attachedNotes ? (
                        <div className="mt-3 rounded-[10px] p-4" style={{ background: "var(--paper)" }}>
                          <p className="text-[11px] font-semibold" style={{ color: "var(--accent)" }}>
                            Note structurée · non appliquée au profil
                          </p>
                          <p className="mt-2 text-[13px]">
                            {attachedNotes.motif.map((item) => item.text).join(" · ")}
                          </p>
                          <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
                            {attachedNotes.complements.filter(
                              (x) =>
                                actionOnNote(
                                  x.produit_id,
                                  patientDossier.recommandations_en_cours,
                                ) === "ajout",
                            ).length}{" "}
                            complément(s) à
                            ajouter · {attachedNotes.suivi.map((item) => item.text).join(" · ")}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
