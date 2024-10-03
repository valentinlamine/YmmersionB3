import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  protected email: string = '';
  protected password: string = '';
  protected pseudo: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  signUp() {
    this.authService.signUp(this.email, this.password, this.pseudo)
      .then(result => {
        console.log('User signed up:', result);
        this.router.navigate(['../auth/login']);
      })
      .catch(error => {
        console.error('Sign up error:', error);
      });
  }
}
