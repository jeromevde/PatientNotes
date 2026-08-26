# Dossier patient + Note-taker

**Durée indicative :** ~1 journée (l'objectif n'est pas de tout finir, mais de montrer comment tu penses et build de bout en bout)
**Format :** tu bosses en autonomie, avec l'IA autant que tu veux. Ensuite : échange technique de 30-45 min avec Nicolas (full-stack senior) + présentation à Victor.

> ⚠️ **RGPD / données de santé** : toutes les données de ce document sont **100 % fictives**. N'utilise jamais de vraie donnée patient pour ce case.
> 

---

## 1. Contexte

Simplycure est utilisé chaque jour par des praticiens de santé (naturopathes, nutritionnistes, médecins fonctionnels). Au cœur de leur travail : le **dossier patient**. Aujourd'hui il est peu structuré, et les praticiens prennent leurs notes de consultation « en vrac ». On veut en faire un vrai atout produit.

## 2. Le problème à résoudre

Deux volets liés :

1. **Repenser l'interface du dossier patient** pour qu'un praticien retrouve et lise l'essentiel en un coup d'œil : historique, motif de consultation, recommandations en cours, suivi.
2. **Intégrer un note-taker** : à partir d'une consultation (transcript texte, cf. Annexe B), générer automatiquement des **notes structurées** rattachées au dossier, par exemple : motif, anamnèse, mode de vie, éléments biologiques, recommandations (compléments + hygiène de vie), prochaines étapes de suivi.

## 3. La mission

Conçois et prototype cette expérience end-to-end : de la consultation → aux notes structurées → à leur place dans un dossier patient repensé. Montre le **flow praticien** complet.

Le note-taker peut être **mocké** : tu pars du transcript d'exemple (Annexe B), tu le passes dans ta logique (IA), tu produis les sections structurées, tu les affiches dans le dossier. Bonus si tu relies les recommandations aux produits du mini-catalogue (Annexe A).

## 4. Contraintes

- Données **100 % mockées** (Annexes A & B). Jamais de vraie donnée patient.
- IA **autorisée et encouragée** (montre ton workflow).
- Résultat **maintenable et explicable**, pas une boîte noire.
- Soigne autant l'**UX** que la techno : ici le produit compte autant que le code.

## 5. Livrable

- Un **prototype qui tourne**.
- Un court **Loom / Claap (5-7 min)** : le problème tel que tu l'as compris, tes choix produit, tes choix techniques, comment tu as utilisé l'IA, et ce que tu ferais avec 2 semaines de plus.

## 6. Évaluation

- **Échange technique avec Nicolas (30-45 min)** : revue de code / archi + discussion des choix.
- **Grille** : product sense / UX (x3) · usage IA pertinent & maîtrisé (x2) · qualité & archi du code, validée par Nicolas (x2) · vélocité / capacité à trancher (x3).

---

## Annexe A — Jeu de données mocké

### Patient (fictif)

```json
{
  "patient": {
    "id": "pat_00427",
    "prenom": "Camille",
    "nom": "Verdonck",
    "date_naissance": "1989-03-14",
    "sexe": "F",
    "email": "camille.verdonck@example.com",
    "praticien_id": "prat_017",
    "cree_le": "2025-11-08"
  },
  "historique_consultations": [
    { "id": "cons_1101", "date": "2026-01-12", "motif": "Fatigue chronique + troubles du sommeil" },
    { "id": "cons_1174", "date": "2026-04-03", "motif": "Suivi : sommeil, digestion, stress" }
  ],
  "recommandations_en_cours": [
    { "produit_id": "prd_mag", "posologie": "1 gélule matin + soir", "depuis": "2026-01-12" },
    { "produit_id": "prd_omega3", "posologie": "2 gélules/jour au repas", "depuis": "2026-01-12" }
  ],
  "biomarqueurs_recents": [
    { "nom": "Ferritine", "valeur": 18, "unite": "µg/L", "ref": "20-200", "date": "2026-03-20", "statut": "bas" },
    { "nom": "Vitamine D (25-OH)", "valeur": 21, "unite": "ng/mL", "ref": "30-60", "date": "2026-03-20", "statut": "bas" },
    { "nom": "TSH", "valeur": 2.1, "unite": "mUI/L", "ref": "0.4-4.0", "date": "2026-03-20", "statut": "normal" }
  ]
}
```

### Mini-catalogue produits (fictif, pour relier les recommandations)

```json
[
  { "id": "prd_mag", "nom": "Magnésium bisglycinate", "labo": "NutriLab", "categorie": "Minéraux", "prix": 24.9 },
  { "id": "prd_omega3", "nom": "Oméga-3 EPA/DHA", "labo": "MarinePure", "categorie": "Acides gras", "prix": 32.0 },
  { "id": "prd_vitd", "nom": "Vitamine D3 2000 UI", "labo": "NutriLab", "categorie": "Vitamines", "prix": 15.5 },
  { "id": "prd_fer", "nom": "Fer bisglycinate + Vitamine C", "labo": "FerroVie", "categorie": "Minéraux", "prix": 19.9 },
  { "id": "prd_probio", "nom": "Probiotiques 10 souches", "labo": "BioFlore", "categorie": "Microbiote", "prix": 29.0 },
  { "id": "prd_ashwa", "nom": "Ashwagandha KSM-66", "labo": "AdaptoNat", "categorie": "Plantes", "prix": 22.5 }
]
```

---

## Annexe B — Transcript de consultation (fictif)

*Consultation de suivi, naturopathie / micronutrition. Praticien (P) ↔ Patiente (Camille, C). ~15 min.*

> **P :** Bonjour Camille, contente de vous revoir. On s'était vus en janvier pour la fatigue et le sommeil. Comment ça va depuis ?
> 
> 
> **C :** Bonjour. Globalement un peu mieux pour le sommeil, je m'endors plus facilement grâce au magnésium le soir. Mais je me réveille encore souvent vers 4h du matin, et j'ai du mal à me rendormir.
> 
> **P :** D'accord. Et la fatigue en journée ?
> 
> **C :** Toujours présente, surtout en fin d'après-midi. J'ai un gros coup de barre vers 16h. Et j'ai remarqué que j'ai les ongles cassants et je perds un peu mes cheveux en ce moment.
> 
> **P :** On va regarder ça, ça peut être lié à votre bilan. Vous avez fait la prise de sang qu'on avait demandée ?
> 
> **C :** Oui, en mars. Vous devriez l'avoir. La ferritine était basse je crois, et la vitamine D aussi.
> 
> **P :** C'est ça : ferritine à 18, c'est sous la barre, et vitamine D à 21, c'est bas aussi. La TSH est normale, donc la thyroïde va bien. La ferritine basse peut clairement expliquer la fatigue, les ongles et la chute de cheveux.
> 
> **C :** Ah, ça a du sens.
> 
> **P :** Côté alimentation, vous mangez de la viande rouge, des légumineuses ?
> 
> **C :** Peu de viande rouge, je suis plutôt flexitarienne. Des lentilles de temps en temps.
> 
> **P :** OK. Et le stress, le travail ?
> 
> **C :** Beaucoup de stress en ce moment, gros projet au boulot. Je bois pas mal de café, genre 4 tasses par jour, et souvent une après 15h.
> 
> **P :** Le café tardif peut jouer sur ces réveils nocturnes. On va essayer de couper le café après 14h. Pour la digestion, ça va ? Ballonnements, transit ?
> 
> **C :** Un peu de ballonnements le soir, oui. Le transit est correct.
> 
> **P :** Bon. Alors voilà ce que je propose. On continue le magnésium bisglycinate matin et soir, ça vous aide sur le sommeil et le stress. On garde les oméga-3. On ajoute du fer bisglycinate avec de la vitamine C pour la ferritine, une gélule le matin à jeun. Et on démarre la vitamine D3, 2000 UI par jour, pour remonter le taux.
> 
> **C :** D'accord.
> 
> **P :** Pour le stress et les réveils, je vous propose aussi de l'ashwagandha le soir pendant un mois, on verra l'effet. Et on teste un mois de probiotiques pour les ballonnements. Côté hygiène de vie : café stop après 14h, et si possible 20 minutes de marche en fin de journée.
> 
> **C :** OK, ça marche.
> 
> **P :** On refait un bilan ferritine et vitamine D dans 3 mois pour voir l'évolution, et on se revoit à ce moment-là. Je vous envoie tout ça via Simplycure.
> 
> **C :** Super, merci beaucoup.
> 

---

### Exemple de sortie structurée attendue (indicatif)

Le note-taker devrait pouvoir produire, à partir du transcript ci-dessus, quelque chose comme :

- **Motif :** suivi fatigue chronique, réveils nocturnes (~4h), fatigue de fin de journée, ongles cassants + chute de cheveux.
- **Anamnèse / biologie :** ferritine basse (18), vitamine D basse (21), TSH normale. Alimentation flexitarienne (peu de fer héminique). Stress professionnel élevé. Café ~4/j dont après 15h. Ballonnements en soirée.
- **Recommandations — compléments :** Magnésium bisglycinate (maintien) · Oméga-3 (maintien) · Fer bisglycinate + Vitamine C (matin, à jeun) · Vitamine D3 2000 UI · Ashwagandha (soir, 1 mois) · Probiotiques (1 mois).
- **Recommandations — hygiène de vie :** stop café après 14h ; marche 20 min en fin de journée.
- **Suivi :** re-bilan ferritine + vitamine D à 3 mois ; RDV de contrôle.