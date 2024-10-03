import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  protected email: string = '';
  protected password: string = '';

  constructor(private authService: AuthService, private router: Router){}

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
}
