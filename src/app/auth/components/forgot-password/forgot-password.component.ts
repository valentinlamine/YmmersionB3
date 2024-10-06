import { Component } from '@angular/core';
import { sendPasswordResetEmail } from '@angular/fire/auth';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  email: string = '';
  showSuccessModal: boolean = false; // Pour afficher un message de succès

  constructor(private authService: AuthService, private router: Router) {}

  // Fonction pour envoyer l'e-mail de réinitialisation de mot de passe
  sendPasswordResetMail() {
    if (!this.email) {
      console.error('Email is required');
      return; // Si l'email est vide, on arrête la fonction
    }

    this.authService.sendPasswordResetEmail(this.email)
      .then(() => {
        console.log('Password reset email sent');
        this.showSuccessModal = true;
      })
      .catch(error => {
        console.error('Password reset error:', error);
      });
  }
}
