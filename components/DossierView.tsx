// Patient dossier screen. Four stacked boxes in the same order as patient.json:
// identity, consultation history, current supplements, lab results.
// Does not edit the patient. Shows an attached note after Confirm.

import { RecsList } from "@/components/RecsList";
import { patientDossier } from "@/lib/data";
import { ageYears, formatDate } from "@/lib/format";
import type { ConsultationNotes } from "@/lib/types";

function statusStyle(statut: string) {
  if (statut === "bas" || statut === "haut") {
    return "bg-warn-soft text-warn";
  }
  return "bg-accent-soft text-accent";
}

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

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-5 pb-16 pt-6">
      <section className="rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
              Patient
            </p>
            <h1 className="mt-1 font-serif text-3xl tracking-tight text-ink">
              {patient.prenom} {patient.nom}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {ageYears(patient.date_naissance)} ans ·{" "}
              {patient.sexe === "F" ? "Femme" : "Homme"} · née le{" "}
              {formatDate(patient.date_naissance)}
            </p>
            <p className="text-sm text-muted">
              {patient.email} · dossier ouvert le {formatDate(patient.cree_le)}
            </p>
          </div>
          <button
            type="button"
            onClick={onStartNote}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90"
          >
            Note de consultation
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          Historique des consultations
        </h2>
        <ol className="mt-4 space-y-4">
          {[...historique_consultations].reverse().map((c) => (
            <li key={c.id} className="flex gap-4 border-b border-line pb-4 last:border-0 last:pb-0">
              <div className="w-36 shrink-0 text-sm text-muted">{formatDate(c.date)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium">{c.motif}</p>
                {c.id === latest.id && attachedNotes ? (
                  <div className="mt-3 rounded-xl bg-accent-soft/60 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
                      Note structurée · non appliquée au profil
                    </p>
                    <p className="mt-2 text-sm">
                      {attachedNotes.motif.map((item) => item.text).join(" · ")}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      {attachedNotes.complements.filter((x) => x.action === "ajout").length}{" "}
                      complément(s) à ajouter ·{" "}
                      {attachedNotes.suivi.map((item) => item.text).join(" · ")}
                    </p>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="p-5">
        <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          Recommandations en cours
        </h2>
        <div className="mt-4">
          <RecsList items={recommandations_en_cours} />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          Biomarqueurs récents
        </h2>
        <ul className="mt-4 space-y-3">
          {biomarqueurs_recents.map((b) => (
            <li key={b.nom} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{b.nom}</p>
                <p className="text-xs text-muted">
                  réf. {b.ref} · {formatDate(b.date)} · {b.source}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(b.statut)}`}>
                {b.valeur} {b.unite} · {b.statut}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
