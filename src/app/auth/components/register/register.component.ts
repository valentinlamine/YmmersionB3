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
    if (this.password !== this.confirmPassword) {
      this.errorMessage = "Les mots de passe ne correspondent pas.";
      this.showError();
      return;
    }
    this.authService.signUp(this.email, this.password, this.pseudo)
      .then(result => {
        console.log('User signed up:', result);
        this.router.navigate(['../']);
      })
      .catch(error => {
        console.error('Sign up error:', error);
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

  toggleError(): void {
    this.isError = !this.isError;
  }

  showError() {
    this.isError = true;
    setTimeout(() => {
      this.isError = false;
    }, 5000);
  }
}
