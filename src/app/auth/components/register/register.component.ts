import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  protected email: string = '';
  protected password: string = '';

  constructor(private authService: AuthService){}

  signUp() {
    this.authService.signUp(this.email, this.password)
      .then(result => {
        console.log('User signed up:', result);
      })
      .catch(error => {
        console.error('Sign up error:', error);
      });
  }
}
