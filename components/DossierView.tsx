// Patient dossier screen: identity, current plan, biomarkers, case timeline.
// Visual design ported from the Claude Design mockup. Self-contained styling
// (own fonts + colors) so it doesn't touch the note-taker's look.
// Does not edit the patient. Shows an attached note after Confirm.

"use client";

import type { CSSProperties } from "react";
import { Newsreader, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import { LabMark } from "@/components/LabMark";
import { patientDossier, productById, formatPrice } from "@/lib/data";
import { ageYears, formatDate } from "@/lib/format";
import type { BiomarkerStatus, ConsultationNotes, PatientDossier } from "@/lib/types";

const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-dossier-serif",
});
const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dossier-sans",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dossier-mono",
});

const serifFont = { fontFamily: "var(--font-dossier-serif), Georgia, serif" };
const monoFont = { fontFamily: "var(--font-dossier-mono), monospace" };

const CARD = { background: "#FFFDF9", border: "1px solid #E6DFD1" };
const LABEL: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "#9A9285",
  fontWeight: 500,
};

const BIO_STYLE: Record<BiomarkerStatus, { label: string; bg: string; fg: string; marker: string }> = {
  bas: { label: "Bas", bg: "#F9EAD6", fg: "#8A5320", marker: "#B9752B" },
  haut: { label: "Haut", bg: "#F9EAD6", fg: "#8A5320", marker: "#B9752B" },
  normal: { label: "Normal", bg: "#E9EDE7", fg: "#4E6B55", marker: "#7A9683" },
};

function parseRef(ref: string): { lo: number; hi: number } {
  const [lo, hi] = ref.split("-").map((s) => parseFloat(s.trim()));
  return { lo, hi };
}

function pct(lo: number, hi: number, v: number): number {
  const span = hi - lo;
  const w0 = Math.max(0, lo - span * 0.55);
  const w1 = hi + span * 0.55;
  return Math.max(1, Math.min(99, ((v - w0) / (w1 - w0)) * 100));
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
    <div
      className={`${serif.variable} ${sans.variable} ${mono.variable} min-h-full`}
      style={{ background: "#F7F3EA", padding: "28px 20px 64px", fontFamily: "var(--font-dossier-sans), Helvetica, Arial, sans-serif", color: "#1C1B18" }}
    >
      <div className="mx-auto" style={{ maxWidth: 1320 }}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#2E6B4F" }} />
            <div style={LABEL}>Simplycure · dossier patient</div>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 13, color: "#8A8377" }}>Praticien · {patient.praticien_id}</span>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#E7E1D4" }} />
          </div>
        </div>

        <section className="rounded-2xl p-6" style={CARD}>
          <div style={LABEL}>Patient · {patient.id}</div>
          <h1 className="mt-2" style={{ ...serifFont, fontSize: 34, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
            {patient.prenom} {patient.nom}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1" style={{ fontSize: 13.5, color: "#6E6759" }}>
            <span>
              {ageYears(patient.date_naissance)} ans · {patient.sexe === "F" ? "Femme" : "Homme"} · née le{" "}
              {formatDate(patient.date_naissance)}
            </span>
            <span style={{ color: "#CFC7B7" }}>|</span>
            <span>{patient.email}</span>
          </div>
        </section>

        <div style={{ height: 24 }} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
          <div className="flex flex-col gap-6">
            <div>
              <div className="mb-3" style={LABEL}>
                Plan en cours
              </div>
              {planItems.length > 0 ? (
                <div className="rounded-2xl overflow-hidden" style={CARD}>
                  {planItems.map((item, i) => (
                    <div
                      key={item.produit_id}
                      className="grid items-start gap-4 p-5"
                      style={{
                        gridTemplateColumns: "1fr auto",
                        borderBottom: i < planItems.length - 1 ? "1px solid #EFEADE" : "none",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {item.product ? <LabMark lab={item.product.labo} size={28} /> : null}
                        <div>
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <span style={{ fontSize: 15.5, fontWeight: 600 }}>{item.product?.nom}</span>
                            <span style={{ fontSize: 12.5, color: "#9A9285" }}>{item.product?.labo}</span>
                          </div>
                          <div style={{ ...monoFont, fontSize: 13, color: "#3A342A", marginBottom: 5 }}>
                            {item.posologie}
                          </div>
                          <div style={{ fontSize: 12.5, color: "#9A9285" }}>
                            Depuis le {formatDate(item.depuis)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div style={{ ...monoFont, fontSize: 14, fontWeight: 500 }}>
                          {item.product ? formatPrice(item.product.prix) : ""}
                        </div>
                        <div style={{ fontSize: 12, color: "#9A9285", marginTop: 2 }}>boîte / mois</div>
                      </div>
                    </div>
                  ))}
                  <div
                    className="flex items-center justify-between px-5 py-3.5"
                    style={{ background: "#FBF8F1" }}
                  >
                    <div style={{ fontSize: 13, color: "#6E6759" }}>Coût mensuel du protocole</div>
                    <div style={{ ...monoFont, fontSize: 15, fontWeight: 500 }}>{formatPrice(planTotal)}</div>
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-2xl px-6 py-8 text-center"
                  style={{ background: "#FFFDF9", border: "1px dashed #E0D9C9" }}
                >
                  <div style={{ ...serifFont, fontSize: 19, marginBottom: 6 }}>
                    Aucune recommandation en cours
                  </div>
                  <p className="mx-auto mb-4" style={{ fontSize: 13, color: "#8A8377", lineHeight: 1.55, maxWidth: 400 }}>
                    La première note de consultation crée le plan.
                  </p>
                  <button
                    type="button"
                    onClick={onStartNote}
                    className="rounded-lg px-4.5 py-2.5 text-sm font-medium"
                    style={{ background: "#2E6B4F", color: "#FFFDF9" }}
                  >
                    Démarrer une consultation
                  </button>
                </div>
              )}
            </div>

            <div>
              <div className="mb-3" style={LABEL}>
                Biomarqueurs récents{latestBioDate ? ` · bilan du ${formatDate(latestBioDate)}` : ""}
              </div>
              {biomarqueurs_recents.length > 0 ? (
                <div className="rounded-2xl" style={CARD}>
                  {problematicBio.length === 0 ? (
                    <div className="px-5 py-4" style={{ fontSize: 13, color: "#6E6759" }}>
                      Aucune valeur hors norme. {biomarqueurs_recents.length} valeur(s) dans les normes.
                    </div>
                  ) : null}
                  {problematicBio.map((b, i) => {
                    const { lo, hi } = parseRef(b.ref);
                    const sty = BIO_STYLE[b.statut];
                    return (
                      <div
                        key={b.nom}
                        className="grid items-center gap-3.5 px-5 py-3"
                        style={{
                          gridTemplateColumns: "1.35fr 130px 152px",
                          borderTop: i === 0 ? "none" : "1px solid #F2EEE4",
                        }}
                      >
                        <div className="min-w-0">
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{b.nom}</div>
                          <div style={{ fontSize: 12, color: "#9A9285" }}>réf. {b.ref} {b.unite}</div>
                        </div>
                        <div className="relative" style={{ height: 6, borderRadius: 3, background: "#F0EBE0" }}>
                          <div
                            className="absolute inset-y-0"
                            style={{
                              left: `${pct(lo, hi, lo)}%`,
                              width: `${pct(lo, hi, hi) - pct(lo, hi, lo)}%`,
                              background: "#DFE6DC",
                              borderRadius: 3,
                            }}
                          />
                          <div
                            className="absolute"
                            style={{
                              top: -4,
                              left: `${pct(lo, hi, b.valeur)}%`,
                              width: 3,
                              height: 12,
                              borderRadius: 2,
                              background: sty.marker,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2.5">
                          <span style={{ ...monoFont, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>
                            {fr(b.valeur)} {b.unite}
                          </span>
                          <span
                            className="rounded whitespace-nowrap px-1.5 py-1"
                            style={{
                              fontSize: 10.5,
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                              fontWeight: 600,
                              background: sty.bg,
                              color: sty.fg,
                            }}
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
                      style={{ borderTop: "1px solid #F2EEE4" }}
                    >
                      <span style={{ fontSize: 12.5, color: "#9A9285" }}>
                        {normalBio.length} autre{normalBio.length > 1 ? "s" : ""} valeur
                        {normalBio.length > 1 ? "s" : ""} dans les normes
                      </span>
                      <button
                        type="button"
                        disabled
                        className="rounded-full px-3.5 py-1.5 text-xs font-medium"
                        style={{ border: "1px solid #E0D9C9", color: "#9A9285", background: "transparent", cursor: "not-allowed" }}
                      >
                        Ouvrir le comparateur de bilan →
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div
                  className="rounded-2xl px-6 py-8 text-center"
                  style={{ background: "#FFFDF9", border: "1px dashed #E0D9C9" }}
                >
                  <div style={{ ...serifFont, fontSize: 19, marginBottom: 6 }}>Aucun bilan au dossier</div>
                  <p style={{ fontSize: 13, color: "#8A8377", lineHeight: 1.55 }}>
                    Aucun biomarqueur n&rsquo;est encore enregistré.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-3" style={LABEL}>
              Fil du dossier
            </div>
            <div className="rounded-2xl px-5 pb-4 pt-4" style={CARD}>
              <button
                type="button"
                onClick={onStartNote}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
                style={{ background: "#2E6B4F", color: "#FFFDF9" }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nouvelle consultation
              </button>

              {timeline.map((entry, i) => {
                const isLast = i === timeline.length - 1;
                const isLatestConsultation = entry.kind === "consultation" && entry.id === latest.id;
                const isConfirmed = isLatestConsultation && Boolean(attachedNotes);
                const accent = entry.kind === "biologie" ? "#B9752B" : isConfirmed ? "#2E6B4F" : "#C4BCAA";
                const typeLabel =
                  entry.kind === "biologie" ? "Biologie" : entry.kind === "ouverture" ? "Ouverture du dossier" : "Consultation";
                const key = entry.kind === "biologie" ? `bio-${entry.date}` : entry.kind === "ouverture" ? "ouverture" : entry.id;
                return (
                  <div
                    key={key}
                    className="grid items-stretch gap-3 py-3.5"
                    style={{
                      gridTemplateColumns: "14px 1fr",
                      borderBottom: isLast ? "none" : "1px solid #EFEADE",
                    }}
                  >
                    <div className="flex flex-col items-center pt-1.5">
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: accent,
                          border: `2px solid ${accent}`,
                          flex: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      {!isLast ? <div style={{ width: 1, flex: 1, background: "#EAE4D7", marginTop: 5 }} /> : null}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#9A9285", marginBottom: 3, fontWeight: 500 }}>
                        {formatDate(entry.date)} · {typeLabel}
                      </div>

                      {entry.kind === "biologie" ? (
                        (() => {
                          const abnormal = entry.items.filter((b) => b.statut !== "normal");
                          const shown = abnormal.length > 0 ? abnormal : entry.items;
                          const restCount = entry.items.length - shown.length;
                          return (
                            <>
                              <div style={{ fontSize: 12.5, color: "#6E6759", lineHeight: 1.5 }}>
                                {shown.map((b) => `${b.nom} ${fr(b.valeur)} ${b.unite}`).join(" · ")}
                              </div>
                              {restCount > 0 ? (
                                <div style={{ fontSize: 12.5, color: "#8A8377", lineHeight: 1.5, marginTop: 2 }}>
                                  + {restCount} autre{restCount > 1 ? "s" : ""} valeur{restCount > 1 ? "s" : ""} dans les normes
                                </div>
                              ) : null}
                            </>
                          );
                        })()
                      ) : entry.kind === "consultation" ? (
                        <div style={{ fontSize: 12.5, color: "#6E6759", lineHeight: 1.5 }}>{entry.motif}</div>
                      ) : null}

                      {isConfirmed && attachedNotes ? (
                        <div className="mt-3 rounded-xl p-4" style={{ background: "#F0F4EF" }}>
                          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2E6B4F" }}>
                            Note structurée · non appliquée au profil
                          </p>
                          <p className="mt-2" style={{ fontSize: 13 }}>
                            {attachedNotes.motif.map((item) => item.text).join(" · ")}
                          </p>
                          <p className="mt-2" style={{ fontSize: 12, color: "#6E6759" }}>
                            {attachedNotes.complements.filter((x) => x.action === "ajout").length} complément(s) à
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
