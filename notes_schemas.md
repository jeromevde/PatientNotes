Just a small markdown to visualize the schemas and the decisions behind them.
Source of truth in code: `lib/types.ts` (UI) and `lib/schema.ts` (LLM contract).

# Transcript

- `consultation_id` string
- `patient_id` string
- `date` YYYY-MM-DD
- `text` string (free text)

# Patient

Read-only in this prototype. Confirm attaches a note; it does not write this file.

- `patient`
  - `id` string
  - `prenom` string
  - `nom` string
  - `date_naissance` YYYY-MM-DD
  - `sexe` string
  - `email` string
  - `praticien_id` string
  - `cree_le` YYYY-MM-DD
- `historique_consultations[]`
  - `id` string
  - `date` YYYY-MM-DD
  - `motif` string
- `recommandations_en_cours[]`
  - `produit_id` string
  - `posologie` string
  - `depuis` YYYY-MM-DD
- `biomarqueurs_recents[]`
  - `nom` string
  - `valeur` number
  - `unite` string
  - `ref` string
  - `date` YYYY-MM-DD
  - `statut` bas | normal | haut
  - `source` laboratoire (lab pipeline only — never the note-taker)

# Products

- `id` string
- `nom` string
- `labo` string
- `categorie` string
- `ingredient` string (swap key — same molecule, other lab)
- `prix` number

# Claim

One atomic clinical fact. Motif, anamnèse, hygiène, suivi are all lists of these.

- `text` string (one sentence)
- `quote` string | null (verbatim substring of the transcript, or null)

A quote that is not an exact slice of the transcript is dropped to null (`keepVerbatimQuotes`).

# Notes

- `consultation_id` string
- `patient_id` string
- `genere_le` YYYY-MM-DD
- `source` transcript
- `used_llm` boolean (added by the API, not by the model)
- `motif` Claim[]
- `anamnese` Claim[]
- `complements[]`
  - `produit_id` string (catalog id, never a free-text name)
  - `action` maintien | ajout | arret
  - `posologie` string | null
  - `duree` string | null
  - `quote` string | null
- `hygiene_de_vie` Claim[]
- `suivi` Claim[]

Unknown `produit_id`s are currently filtered out. Gap: they should be flagged, not silent.

# Decisions

Facts are arrays, not one blob per section. A practitioner edits one line at a time; the UI can paint one quote at a time. A paragraph would kill both.

Complements stay structured (catalog id + action + posologie), not free text, because they have to map onto Simplycure products — and later onto `recommandations_en_cours`. Same `ingredient` → replace the row (lab swap), don't duplicate the molecule.

These two patient lists would be updated on Confirm in a real product (biomarkers stay on the lab pipeline):

```
- historique_consultations[]  →  motif of this visit
- recommandations_en_cours[]  →  complements after apply
```

This prototype does not write them. Keeps the demo fixed, no reset logic.
