# Chat App - Angular 16 & Firebase

## Présentation

Ce projet est une application de chat en temps réel construite avec **Angular 16** et **Firebase**. Il s'agit d'une démonstration simple d'une application de messagerie qui permet aux utilisateurs de s'inscrire, de se connecter et de discuter dans des salles de chat. L'application utilise **Firebase Authentication** pour la gestion des utilisateurs et **Realtime Database** pour le stockage des messages et des données en temps réel.

## Fonctionnalités

- Authentification avec **Firebase Authentication** (Inscription/Connexion/Deconnexion)
- Système de chat en temps réel avec **Realtime Database**

## Prérequis

Avant de commencer, assurez-vous d'avoir les éléments suivants installés sur votre machine :

- [Node.js](https://nodejs.org/) (version 14 ou plus récente)
- [Angular CLI](https://angular.io/cli) (version 16 ou plus récente)
- [Firebase CLI](https://firebase.google.com/docs/cli) (facultatif pour le déploiement)

## Installation

Suivez ces étapes pour configurer et exécuter le projet localement.

### 1. Clonez le dépôt

```bash
git clone https://github.com/votre-utilisateur/chat-app-angular-firebase.git
cd chat-app-angular-firebase
```

### 2. Installez les dépendances

```bash	
npm install
```

### 3. Configuration de Firebase

- Rendez-vous sur [Firebase Console](https://console.firebase.google.com/) et créez un nouveau projet Firebase
- Activez **Firebase Authentication** (méthode Email/Password).
- Activez **Realtime Database** pour stocker les messages en temps réel.
- Configurez votre application Web dans Firebase et copiez la configuration Firebase dans votre environnement.

#### 4. Lancez l'application

```bash
ng serve
```

L'application sera accessible par défaut à l'adresse suivante : (http://localhost:4200/)

