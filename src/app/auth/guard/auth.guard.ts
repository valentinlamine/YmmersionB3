import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import firebase from "firebase/compat/app";

export const AuthGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if(!auth.IsAuthenticated()) {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        auth.Auticate(true);
        console.log("passé dans la func")
        return true
      } else {
        router.navigateByUrl('/auth/login')
        console.log("Authenticated is " + auth.IsAuthenticated())
        return false
      }
    });

  }
  return true
}
