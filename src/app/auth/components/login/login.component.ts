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

  constructor(private authService: AuthService, private router: Router) {}

  signIn() {
    this.authService.signIn(this.email, this.password)
      .then(result => {
        console.log('User signed in:', result);

        this.router.navigate(['../']);
      })
      .catch(error => {
        console.error('Sign in error:', error);
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
}
