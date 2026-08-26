// Shapes of our four JSON documents: patient, products, notes, and a quoted claim.
// This is the contract the UI and the API both follow.

export type BiomarkerStatus = "bas" | "normal" | "haut";
export type ComplementAction = "maintien" | "ajout" | "arret";

export type Product = {
  id: string;
  nom: string;
  labo: string;
  categorie: string;
  ingredient: string;
  prix: number;
};

export type PatientDossier = {
  patient: {
    id: string;
    prenom: string;
    nom: string;
    date_naissance: string;
    sexe: string;
    email: string;
    praticien_id: string;
    cree_le: string;
  };
  historique_consultations: {
    id: string;
    date: string;
    motif: string;
  }[];
  recommandations_en_cours: {
    produit_id: string;
    posologie: string;
    depuis: string;
  }[];
  biomarqueurs_recents: {
    nom: string;
    valeur: number;
    unite: string;
    ref: string;
    date: string;
    statut: BiomarkerStatus;
    /** Lab API or PDF import — never written by the note-taker. */
    source: "laboratoire";
  }[];
};

export type Claim = {
  text: string;
  quote: string | null;
};

export type ComplementRec = {
  produit_id: string;
  action: ComplementAction;
  posologie: string | null;
  duree: string | null;
  quote: string | null;
};

export type ConsultationNotes = {
  consultation_id: string;
  patient_id: string;
  genere_le: string;
  source: "transcript";
  used_llm: boolean;
  motif: Claim[];
  anamnese: Claim[];
  complements: ComplementRec[];
  hygiene_de_vie: Claim[];
  suivi: Claim[];
};
