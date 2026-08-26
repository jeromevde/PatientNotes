Just a small markdown to visualize the schema's and make appropriate decisions

# Transcript

- `consultation_id` string
- `patient_id` string
- `date` YYYY-MM-DD
- `text` string (free text)

# Patient

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
  - `source` laboratoire

# Products

- `id` string
- `nom` string
- `labo` string
- `categorie` string
- `ingredient` string (swap key — same molecule, other lab)
- `prix` number

# Notes

- `consultation_id` string
- `patient_id` string
- `genere_le` YYYY-MM-DD
- `source` transcript
- `used_llm` boolean
- `motif` `{ text, quote }`
- `anamnese` `{ text, quote }`
- `complements[]`
  - `produit_id` string
  - `action` maintien | ajout | arret
  - `posologie` string | null
  - `duree` string | null
  - `quote` string | null
- `hygiene_de_vie` `{ text, quote }`
- `suivi` `{ text, quote }`


# Decision on Notes schema

-> this is the important part, left open probably on purpose!
the following 2 would need to be updated in the patient record
(biomarkers are updated via a separate blood testing pipeline)
```
- `historique_consultations[]`
  - `id` string
  - `date` YYYY-MM-DD
  - `motif` string
- `recommandations_en_cours[]`
  - `produit_id` string
  - `posologie` string
  - `depuis` YYYY-MM-DD
```
Which is why we make complements a structured (not free form text) format and also because it will allow to link back to the supplements of simplycure