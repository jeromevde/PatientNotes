
# Requirements

General thoughts after reading the text. Main reuirements seems to be a focus on UX, user experience, following the caretaker journey, EXPLAINABILITY, fake data and maintainablility (which i would say means the code should be simple, not overengineered)

THIS SHOULD BE A TOOL - SIMPLE - NOT TOO MUCH INFO SO THE IT HELPS THE PRACTITIONER AND DOESN'T
OVERLOAD HIM WITH USELESS DETAILS

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
- - add a landing page with patient list ? -> would be good for a test suite

 # Gaps
 - Unknown catalog ids are silently dropped. 
 - stress test with adverserial transcripts

 - Clearly passing the full catalog on every request to the LLM is a dumb idea and only for this demo. In practice I expected Simplycure catalog to be quite large and not necessarily (or be costly to do so) fit in an llm context window. I'd design a quick intermediate step with an Openai's embedding model text-embedding-3-small to query a predefined list of 10 close matches to the extracted text and then a second call to decide which one of those. In practice this happens in the background when the user has not even opened the supplement tab so he wouldn't even notice the delay.



# Réponse video:

Un court Loom / Claap (5-7 min) : le problème tel que tu l'as compris, tes choix produit, tes choix techniques, comment tu as utilisé l'IA, et ce que tu ferais avec 2 semaines de plus.


## 1. Le problème (~45s)

Dossier peu structuré + notes en vrac → le praticien tape au lieu d'écouter, ou il faut une secrétaire.

## 2. Choix produit (~2 min)

- Accueil = l'essentiel seulement: protocole en cours, biomarqueurs hors norme, historique. Le reste s'expand. Un praticien n'a pas le temps d'un dashboard avec plein de details
- Flow: dossier → transcript + note sur le même écran → review → enregistrer. Pas de jonglage entre fenêtres.
- Review obligatoire. Un dump auto, un praticien ne le signera pas.
- Faits en lignes, pas un paragraphe: on édite une ligne, on highlight une quote.
- Double panel + highlight quote↔fait = pas une black box. (Cliquer un fait ici.)
- Arrêt / Ajout / Maintien est un label, jamais un champ. Le code l'infère du plan vs la note. Le praticien ne devrait pas écrire de l'admin.
- Enregistrer rattache la note et met à jour le plan. Les biomarqueurs restent le pipeline labo. Refresh = reset demo.

## 3. Choix techniques (~1 min 30) — des coupes, pas un stack

- Next.js + React, un deploy Vercel. Stack Simplycure (Go/AWS) plus tard: le contrat JSON et le flow UI sont le vrai travail; traduire le backend c'est mécanique.
- Note en 5 listes: motif, anamnèse, compléments, hygiène, suivi. Compléments = `produit_id` catalogue, jamais un nom libre.
- Un POST `/api/notes`. Données mock en JSON. Pas de DB, pas d'auth, un patient. Refresh reset. La démo tourne toujours (LLM seulement si clé).
- Un appel LLM (Haiku), JSON in / JSON out. Pas de chain. Catalogue injecté dans le prompt: assez petit ici, trop bête en prod → embeddings après.
- Chaque fait = `(texte, quote)`. Quote pas verbatim dans le transcript → on la drop. Sourcé ou rien.
- Zod valide la sortie. JSON cassé → note vide éditable, pas un crash. IDs catalogue inconnus: filtrés aujourd'hui (gap: les flagger).

## 4. Utilisation IA (~1 min)

Cursor en local pour coder. Claude Design / Claude Code pour l'UI.
Plusiers IA web pour challenger des idées, screenshots et autre


## 5. 2 semaines de plus (~45s) — 3 paris

1. Suite d'eval (transcripts adverses) pour changer de modèle sans deviner.
2. Retrieval catalogue (embed → top 10 → 2e passe). Le prompt unique ne scale pas.
3. Audio in, même écran de review. Le produit ne change pas, seul l'input.

Hors vidéo (échange Nicolas / Victor, pas le Loom):
- modèle le moins cher qui tient l'eval
- ZDR, provider en direct (pas d'intermédiaire) — données médicales
- code EN + i18n
- stack Simplycure (AWS, terraform, Go)
- multi-praticien / multi-patient / auth
- standard biologie? export réseau Wallon / BX / NL?



- Le problématique: Dossier peu structuré + notes en vrac → le praticien tape au lieu d'écouter, ou il faut une secrétaire
- Choix produits:
    - Écran accueil simple avec l’essentiel
        - Protocol en cours
        - Biomarquers récents problématiques
        - Historique consultation/biologie du patient
    - Main possibilité d’expand différentes partie si on veut plus de détails
    - Double panel avec highlighting pour l’explicabilité (pas blackbox)
- Choix techniques:
    - Nextjs avec deployment sur vercel avec front REACT
    - Schema de la note en 5 parties
        - Motif, anamnèse, complément, hygiénique de vie, suivi
    - Velocité: un endpoint post, données moquées en json et pas de rétention des données (refresh pour reset la demo)
    - Demander tuples modèle (quote, fait) pour chaque fait dans la note structurée = sourcé
    - Simple requête json LLM Haiku, Injection du catalogue dans le prompt pour une solution 1 temps, rapide (plus tard embedding)
    - Validation schema librairie ZOD
    - Warning ID retourné inexistant est retourné ou si le modèle retourne pas de json
- Utilisation IA: cursor en local, Claude design avec intégration claude code
- 2 semaines de plus
    - Test stress test & benchmarking suite for rapid iteration later
    - Retrieval over the catalog (embeddings) before the catalog outgrows the prompt
    - audio recording / photo parsing




(and some extras)
    - Cost/performance modèle le mois cher
    - ZDR and no trustworthy model providers (medical data!)
    - english as the code language with tranlsation options
    - simplycure stack compatible (AWS, terraform, go, ...)
    - multi-practicien , multi-patient, auth, ...
    - is there a STANDARD for biology tests ?
    - Export / Import réseau de santé Wallon/BX/NL ?
