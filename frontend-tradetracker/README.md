# TradeTracker

TradeTracker est une application Angular conçue pour gérer intelligemment des comptes de trading multi-devises (USD et EUR). L'application permet de centraliser la gestion des soldes, objectifs, retraits, dépôts, et calculs de performances pour chaque compte sur différentes plateformes de trading.

## Fonctionnalités

- **Tableau de bord** : Vue globale affichant les totaux par devise et alertes de seuils atteints
- **Gestion des comptes** : Liste, détails et création de comptes de trading
- **Suivi des transactions** : Historique des dépôts et retraits pour tous les comptes
- **Paramètres personnalisables** : Configuration des règles de retrait, taux de change et options d'affichage
- **Support multi-devises** : Gestion des comptes en USD et EUR avec agrégation par devise
- **Calculs de performance** : Suivi de la progression vers les objectifs et suggestions de retraits

## Structure du projet

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/
│   │   ├── accounts/
│   │   ├── account-detail/
│   │   ├── add-account/
│   │   ├── transactions/
│   │   └── settings/
│   ├── models/
│   │   ├── account.model.ts
│   │   └── transaction.model.ts
│   ├── services/
│   │   ├── account.service.ts
│   │   ├── transaction.service.ts
│   │   └── analytics.service.ts
│   ├── app.component.ts
│   ├── app.module.ts
│   └── app-routing.module.ts
├── assets/
└── styles.css
```

## Modèles de données

### Compte de trading

Chaque compte de trading inclut :
- ID unique
- Nom du compte
- Broker (Roboforex, IC Markets, ou autre)
- Devise (USD ou EUR)
- Solde actuel
- Objectif
- Seuil de retrait
- Dépôts et retraits cumulés
- Dates de création et de mise à jour

### Transaction

Chaque transaction inclut :
- ID unique
- ID du compte associé
- Type (dépôt ou retrait)
- Montant
- Devise
- Date
- Description (optionnelle)

## Services

### AccountService

Service CRUD pour les comptes de trading, utilisant RxJS avec BehaviorSubject pour la gestion d'état.

### TransactionService

Gestion des dépôts et retraits liés à chaque compte.

### AnalyticsService

Calculs financiers : gains/pertes, pourcentages d'atteinte des objectifs, suggestions de retraits, et conversion de devises.

## Prérequis techniques

- Angular 16+
- Node.js et npm
- Connexion à un backend API REST (Node.js avec PostgreSQL)

## Installation

1. Cloner le dépôt
2. Installer les dépendances avec `npm install`
3. Démarrer le serveur de développement avec `ng serve`
4. Accéder à l'application sur `http://localhost:4200`

## Développement

L'application utilise :
- Reactive Forms pour les formulaires
- RxJS pour la gestion d'état via BehaviorSubject
- HttpClient pour la communication avec l'API backend
- Architecture modulaire avec séparation des responsabilités

## Fonctionnalités à venir

- Support pour d'autres devises
- Graphiques de performance
- Import/export de données
- Application mobile
