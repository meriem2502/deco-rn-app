# DECO RN ADMIN - Système de Gestion de Location pour Nadjla

Cette application PWA hors-ligne de haut niveau permet à l'administratrice Nadjla de gérer l'intégralité de son activité de location (box de fiançailles, box de mariage, valises et accessoires).

## Fonctionnalités Clés
- **100% Client-Side / Hors-ligne** : Aucune base de données distante, pas d'API, sécurité totale via IndexedDB.
- **PWA (Progressive Web App)** : Installable sur Android et iOS, utilisable sans connexion internet.
- **Design d'exception** : Interface haut de gamme inspirée d'Apple, Notion et Stripe avec effets de flou de verre (glassmorphism).

## Architecture des Dossiers et Fichiers

```text
DECO-RN-ADMIN/
├── index.html            (Écran de connexion administrative)
├── dashboard.html        (Statistiques rapides, alertes et raccourcis)
├── commandes.html        (Historique, filtres, recherche et actions de commandes)
├── nouvelle.html         (Formulaire de réservation de commande)
├── modifier.html         (Formulaire d'édition de commande existante)
├── produits.html         (Gestion du catalogue d'articles)
├── clientes.html         (Gestion de l'historique et fidélisation clients)
├── calendrier.html       (Planning visuel d'occupation)
├── statistiques.html     (Graphes d'analyse de revenus avec Chart.js)
├── parametres.html       (Configuration générale, import/export de sauvegardes)
├── manifest.json         (Métadonnées d'installation Android/PWA)
├── service-worker.js     (Script de mise en cache hors-ligne)
├── css/
│   ├── style.css         (Design global, charte graphique Poppins/Rose/Doré)
│   ├── dashboard.css     (Grid de cartes, glassmorphism et animations)
│   ├── table.css         (Listes, filtres de recherche et fiches clients)
│   ├── forms.css         (Champs de formulaires luxueux)
│   └── calendar.css      (Style du planning d'occupation mensuel/hebdo/journalier)
└── js/
    ├── database.js       (Classe wrapper IndexedDB)
    ├── auth.js           (Session et contrôle d'accès)
    ├── ui.js             (Génération de la barre de navigation et composants communs)
    ├── dashboard.js      (Logique métier du tableau de bord)
    ├── commandes.js      (Système de recherche, de filtrage et d'impression)
    ├── produits.js       (Gestion d'inventaire et états)
    ├── clientes.js       (Suivi de fidélité et contact)
    ├── calendar.js       (Génération du calendrier d'occupation)
    └── stats.js          (Initialisation et mise à jour de Chart.js)
```
