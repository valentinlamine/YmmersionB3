import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

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
      const user = userCredential.user;
      if (!user) {
        throw new Error("L'utilisateur n'a pas pu être créé.");
      }
      return this.db.object(`users/${user.uid}`).set({
        email: user.email,
        pseudo: pseudo
      });
    });
  }

  // Sign up with Google
  signUpWithGoogle() {
    return this.afAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then((result) => {
      const user = result.user;
      if (!user) {
        throw new Error("L'utilisateur n'a pas pu être créé.");
      }
      return this.db.object(`users/${user.uid}`).set({
        email: user.email,
        pseudo: user.displayName // Assuming the displayName is used as pseudo
      });
    });
  }

  // Sign in with Google
  signInWithGoogle() {
    return this.afAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then((result) => {
      const user = result.user;
      if (!user) {
        throw new Error("L'utilisateur n'a pas pu être créé.");
      }
      const userRef = this.db.object(`users/${user.uid}`);
      userRef.valueChanges().subscribe((userData) => {
        if (!userData) {
          userRef.set({
            email: user.email,
            pseudo: user.displayName // Assuming the displayName is used as pseudo
          });
        }
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
