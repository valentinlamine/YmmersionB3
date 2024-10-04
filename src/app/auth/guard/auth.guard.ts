import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const AuthGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if(!auth.IsAuthenticated()) {
    router.navigateByUrl('/auth/login')
    console.log("gné: " + auth.IsAuthenticated())
    return false
  }
  return true
}
