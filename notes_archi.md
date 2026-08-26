
# Requirements
## input
- free text transcript "transcript texte"
- structured patient json
- structured product json
## output
- structured notes.json ()
    - linked to mini-catalogue products
## UI
- intuitive
    - structured transcript and notes should appear on the same window so the doctor has context of his notes to verify structured output

- integrated:
     paste transcript → generate → edit → confirm (notes attached, no write-back to patient yet)
     linked with products !

## Code
- maintainable
    - simple componenents, top level comment explaining in plain language what it does
- explainable
    - one pass LLM calls with validation

# Deliverable
- running prototype
- Loom 5–7 min (problem, product, tech, how I used IA, 2 weeks more)
- public Vercel URL for the demo (données fictives banner)

# Decisions
- review step (auto-dump will not fly with practicians)
- backend in go, AWS, react for simplycure integration ? No: translate later with AI it's easy, ship a prototype quickly for feedback now
- langchain ? No overkill, one llm call (more explainable and controllable)

- Vercel Hobby: mock notes by default, live LLM only if API key is set (prototype always runs)
- one patient, no auth, no multi-praticien
## Schema
**Notes** (this workflow): motif, anamnèse, hygiène, suivi = free text. Compléments = produit_id + action.
**Dossier**: biomarqueurs come from lab API / PDF — read by the note-taker, never written by it.
**Confirm (later)**: patch `recommandations_en_cours` (ajout/maintien/arret) + append/update `historique_consultations` (motif). Do not touch biomarqueurs. Hygiène/suivi still later.

- UI and agent reasoning in french for now - later switch to english
- Do not update the patient profile on Confirm in this prototype. Notes stay a draft. 

# Later (2 weeks)

- Test suite with many patients to assess quality, avoid overfitting of solution and ship fast after and also to test bugs (product not in catalog, multiple products similar name, etc etc)

- Confirm applies notes: `recommandations_en_cours` + `historique_consultations`. Never biomarqueurs.
- cost performance ? cheapest model that gets the job done
- ZDR and no trustworthy model providers (medical data!)
- benchmarking suite for rapid iteration later
- mobile friendly React PWA used by practitioner with
    - audio recording
    - photo parsing
- english as the code language with tranlsation options
- simplycure stack compatible (AWS, terraform, go, ...)
- multi-practicien , multi-patient, auth, ...
- is there a STANDARD for biology tests ?
- Export / Import réseau de santé Wallon/BX/NL ?

@Cursor : challenge my notes please. Did I miss anything ? answer shortly and simply
-> also sent into claude sonnet for challenging


FINAL THOUGHT:

grading is as follows:
 product sense / UX (x3) · usage IA pertinent & maîtrisé (x2) · qualité & archi du code, validée par Nicolas (x2) · vélocité / capacité à trancher (x3).

 did we get this right ??