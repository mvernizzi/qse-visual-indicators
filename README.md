# Indicateurs QSE — Power-Up Trello

Le tableau de bord conserve les trois indicateurs existants :
- Sécurité (croix)
- Qualité (diamant)
- Dysfonctionnement (croix)

## Fonctionnement des données

Les cartes Trello de la liste `Événements QSE` sont désormais la source de données du tableau de bord. Chaque sélection de couleur crée ou met à jour une carte événement contenant l'indicateur, le jour, le mois, l'année, le libellé et la couleur. Une sélection verte crée également une carte. Modifier la couleur d'un jour met à jour sa carte au lieu d'en créer une nouvelle.

Les événements sont lus dans `Événements QSE` et `Archives QSE`. Le tableau de bord ne réécrit plus un calendrier complet dans le stockage partagé Power-Up du tableau : la limite de PluginData ne bloque donc plus l'enregistrement des calendriers mensuels.

Les anciennes données de novembre 2026 sont reprises progressivement depuis l'ancien stockage partagé vers les cartes événement, sans supprimer les anciennes données. Les anciennes cartes événement au format de description précédent sont également reconnues.

## Listes Trello nécessaires

- `Événements QSE` : cartes du mois en cours (créée automatiquement si elle manque).
- `Archives QSE` : cartes des mois précédents.
- `STANDARD BRIEFING` : conservée pour les autres usages ; aucune nouvelle carte récapitulative QSE n'y est créée.

## Autorisation

À la première ouverture, cliquer sur `Connecter Trello` et autoriser l'accès en lecture et écriture. Cette autorisation est utilisée pour lire, créer, modifier et archiver les cartes événement.

## Archivage mensuel

Le workflow GitHub Actions `Gestion mensuelle QSE` reste planifié le premier jour de chaque mois. Le script `scripts/monthly-qse.js` :

1. déplace les anciennes cartes `Indicateurs QSE - ...` de `STANDARD BRIEFING` vers `Archives QSE` (sans les supprimer) ;
2. déplace les cartes événement dont la date est antérieure au mois courant de `Événements QSE` vers `Archives QSE` ;
3. ne crée plus de carte mensuelle `Indicateurs QSE`.

Le calendrier du nouveau mois est vide car le tableau de bord ne charge que les cartes correspondant au mois et à l'année en cours.

## Déploiement

```bash
npm ci
npm run lint
npm run build
git add .
git commit -m "Basculer les indicateurs QSE sur les cartes événement"
git push
```

Les secrets GitHub Actions existants restent nécessaires : `TRELLO_API_KEY`, `TRELLO_TOKEN` et `TRELLO_BOARD_ID`.
