import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  protected email: string = '';
  protected password: string = '';
  showModal: boolean = false;
  showSuccessModal: boolean = false;
  errorMessage: string = '';
  showPassword: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  signIn() {
    // Réinitialiser le message d'erreur
    this.errorMessage = '';

    // Vérification de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email || !emailRegex.test(this.email)) {
      this.errorMessage = "Veuillez entrer une adresse e-mail valide.";
      this.showError();
      return;
    }

    // Vérification du mot de passe
    if (!this.password || this.password.trim().length === 0) {
      this.errorMessage = "Le mot de passe est obligatoire.";
      this.showError();
      return;
    }

    // Si tout est bon, procéder à la connexion
    this.authService.signIn(this.email, this.password)
      .then(result => {
        console.log('User signed in:', result);
        this.router.navigate(['../']);
      })
      .catch(error => {
        this.errorMessage = "Erreur de connexion. Veuillez vérifier vos identifiants.";
        this.showError();
      });
  }

  signInWithGoogle() {
    this.authService.signInWithGoogle()
      .then(result => {
        console.log('User signed in with Google:', result);
        this.router.navigate(['../']);
      })
      .catch(error => {
        console.error('Google sign in error:', error);
      });
  }

  sendPasswordResetEmail() {
    if (!this.email) {
      this.showModal = true;
      return;
    }
  }

  closeModal() {
    this.showModal = false;
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
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
