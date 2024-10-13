# Chat App - Angular 16 & Firebase

## Présentation

Ce projet est une application de chat en temps réel construite avec Angular 16 et Firebase. Il permet aux utilisateurs de créer des comptes, de se connecter et de discuter dans des salles de chat. L'application utilise Firebase Authentication pour la gestion des utilisateurs, et Firebase Realtime Database pour le stockage et la synchronisation des messages en temps réel.

## Fonctionnalités

### Authentification Firebase

- **Inscription et connexion sécurisées** : Les utilisateurs peuvent s'inscrire en se créant un compte ou se connecter via google. Ils peuvent également se déconnecter à tout moment.
- **Réinitialisation de mot de passe** : Possibilité d'envoyer un email pour réinitialiser un mot de passe oublié.
- **Gestion de session** : Firebase gère automatiquement les sessions utilisateurs avec des tokens pour la persistance de la connexion.
- **Protection des routes** : Les routes sont protégées pour empêcher l'accès aux utilisateurs non auth
- **Gestion des erreurs** : Les erreurs d'authentification sont gérées et affichées à l'utilisateur.

### Système de Chat en Temps Réel

- **Création de salles de chat** : Les utilisateurs peuvent créer des salles de chat pour discuter avec d'autres utilisateurs, que ce soit des conversations privées ou en groupe.
- **Liste des membres** : Les utilisateurs peuvent voir la liste des membres de la salle de chat.
- **Ajouter et supprimer des membres** : Les utilisateurs peuvent ajouter ou supprimer des membres de la salle de chat.
- **Quitter une salle de chat** : Les utilisateurs peuvent quitter une salle de chat à tout moment.
- **Envoi de messages** : Les utilisateurs peuvent envoyer des messages textuels dans les salles de chat avec la date de l'envoie et qui sont synchronisés en temps réel pour tous les utilisateurs de la salle de chat.
- **Envoie de fichiers** : Les utilisateurs peuvent envoyer des fichiers (images, vidéos, documents) dans les salles de chat.

## Prérequis

Avant de commencer, assurez-vous d'avoir les éléments suivants installés sur votre machine :

- [Node.js](https://nodejs.org/) (version 20 ou plus récente)
- [Angular CLI](https://angular.io/cli) (version 16 ou plus récente)

## Installation

Suivez ces étapes pour configurer et exécuter le projet localement.

### 1. Clonez le dépôt

```bash
git clone https://github.com/valentinlamine/YmmersionB3.git
```

### 2. Installez les dépendances

```bash	
npm install

```

### 2. Installez les dépendances
Dans le fichier node_modules\@angular\fire\compat\database\interfaces.d.ts
Remplacer les lignes 37 à 44 :

```bash	
export interface Action<T> {
    type: ListenEvent;
    payload: T;
}
export interface AngularFireAction<T> extends Action<T> {
    prevKey: string | null | undefined;
    key: string | null;
}

```

Par les lignes suivantes :
  
  ```bash
  
  export interface DatabaseSnapshotExists<T> extends firebase.database.DataSnapshot {
    exists(): true;
    val(): T;
    // forEach(action: (a: DatabaseSnapshot<T>) => boolean): boolean;
    forEach(action: (a: firebase.database.DataSnapshot & { key: string }) => boolean | void): boolean;
  }
  export interface DatabaseSnapshotDoesNotExist<T> extends firebase.database.DataSnapshot {
    exists(): false;
    val(): null;
    // forEach(action: (a: DatabaseSnapshot<T>) => boolean): boolean;
    forEach(action: (a: firebase.database.DataSnapshot & { key: string }) => boolean | void): boolean;
  }

```

#### 4. Lancez l'application

```bash
ng serve
```

L'application sera accessible par défaut à l'adresse suivante : (http://localhost:4200/)

