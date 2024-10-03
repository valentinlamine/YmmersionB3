import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  user: any;
  
  message = '';
  messages: any[] = [];

  constructor(
    private afAuth: AngularFireAuth,
    private chatService: ChatService
  ){}

  ngOnInit(){
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.user = user.uid;
        console.log("User : ", this.user);
      }
    });

    this.chatService.getMessages().subscribe(messages => {
      this.messages = messages;
      console.log(this.messages);
    });
  }

  sendMessage() {
    this.chatService.sendMessage(this.message, this.user);
    this.message = '';
  }

}
