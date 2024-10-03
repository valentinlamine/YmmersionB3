import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {AngularFireDatabase} from "@angular/fire/compat/database";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth, private db: AngularFireDatabase) {}

  // Sign in with email and password
  signIn(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  // Sign up with email and password
  signUp(email: string, password: string, pseudo: string) {
    return this.afAuth.createUserWithEmailAndPassword(email, password).then((userCredential) => {
      // Récupérer l'UID de l'utilisateur
      const user = userCredential.user;
      if (!user) {
        throw new Error("L'utilisateur n'a pas pu être créé."); // Lancer une erreur si user est null
      }

      // Ajouter les informations de l'utilisateur dans la base de données
      return this.db.object(`users/${user.uid}`).set({
        email: user.email,
        pseudo: pseudo
      });
    });
  }

  // Sign out
  signOut() {
    return this.afAuth.signOut();
  }

  // Get current user
  getUser() {
    return this.afAuth.authState;
  }

}
