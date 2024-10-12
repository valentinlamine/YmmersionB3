import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {NgForm} from "@angular/forms";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  email: string = '';
  pseudo: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  signUp() {
    // Réinitialiser le message d'erreur
    this.errorMessage = '';

    // Vérification de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email || !emailRegex.test(this.email)) {
      this.errorMessage = "Veuillez entrer une adresse e-mail valide.";
      this.showError();
      return;

    }

    // Vérification du pseudo
    if (!this.pseudo || this.pseudo.trim().length === 0) {
      this.errorMessage = "Le pseudo est obligatoire.";
      this.showError();
      return;
    }

    // Vérification du mot de passe
    if (!this.password || this.password.length < 6) {
      this.errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
      this.showError();
      return;
    }

    // Vérification de la confirmation du mot de passe
    if (this.password !== this.confirmPassword) {
      this.errorMessage = "Les mots de passe ne correspondent pas.";
      this.showError();
      return;
    }

    // Si tout est bon, procéder à l'inscription
    this.authService.signUp(this.email, this.password, this.pseudo)
      .then(result => {
        console.log('User signed up:', result);
        this.router.navigate(['../']);
      })
      .catch(error => {
        this.errorMessage = "Mail déjà utilisé.";
        this.showError();
      });
  }


  signUpWithGoogle() {
    this.authService.signUpWithGoogle()
      .then(result => {
        console.log('User signed up with Google:', result);
        this.router.navigate(['../']);
      })
      .catch(error => {
        console.error('Google sign up error:', error);
      });
  }

  isError: boolean = false;

  showError() {
    if (!this.isError) {
      this.isError = true;
      setTimeout(() => {
        this.isError = false; // L'erreur disparaîtra après 4 secondes
      }, 4000);
    }
  }
}
