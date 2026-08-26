
# Requirements

General thoughts after reading the text. Main reuirements seems to be a focus on UX, user experience, following the caretaker journey, EXPLAINABILITY, fake data and maintainablility (which i would say means the code should be simple, not overengineered)

| | what |
|---|---|
| **input** | free text transcript · structured patient json · structured product json |
| **output** | structured notes.json, linked to mini-catalogue products |
| **not in this prototype** | patient info updated |

## Principles
The UI should be intuitive, it should put itself in the shoes of the caretaker who has to handle a million things at the same time. For example you don't want him juggling between screen to verify the data. So I would already decide to but the raw notes and extract data on the same screen. Maybe even with connectors.

It should also be integrated. Transcript generation, editing, confirming all working together and linking to the simplycure products

Code should be maintainable. Which in my view means brutally simple. Simple componenents. Top level comment explaining in plain language what it does on every important file.

# Deliverable
- running prototype 
- Loom 5–7 min (problem, product, tech, how I used IA, 2 weeks more)  

Extra:
- public Vercel URL for the demo (données fictives banner)

# Decisions
- one pass LLM calls with validation (explainalbe and simple, no langchain)
- review step (auto-dump will not fly with practicians)
- Simple next backend so i can push the demo to Vercel. Translation to go and aws would be a few agent calls anyways and i need the backend code to integrate it correctly anyways.
- patient info won't get modified by the notes to keep the demo fixed and avoid reset logic

- Vercel Hobby: mock notes by default, live LLM only if API key is set (prototype always runs)
- one patient, no auth, no multi-praticien
- Schema design is explained in notes_schemas.md
- UI and agent reasoning in french for now - later switch to english
- Ajout/maintient logic is stupid an annoying for practitioner i think. Make it native in the ui but no explicit writing.


# Question
Edge case: LLM recommends something not in the catalog IDs you feed it. Worth a one-line fallback now (e.g., flag as "produit non trouvé"), not just "later" — it's cheap and shows you thought about the failure mode, which matters for the "explainable, not black box" requirement.

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


 # Todo
 - linking quotes
 - fix main ui, bilan,  claude code ?
 - ajout maintient logic