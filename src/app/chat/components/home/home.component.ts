import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  user: any;
  pseudo: string = '';
  message: string = '';
  messages: any[] = [];

  constructor(
    private afAuth: AngularFireAuth,
    private chatService: ChatService,
    private db: AngularFireDatabase
  ) {}

  ngOnInit() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.user = user.uid;
        console.log("User ID: ", this.user);

        this.db.object(`users/${this.user}`).valueChanges().subscribe((userData: any) => {
          if (userData) {
            this.pseudo = userData.pseudo;
            console.log("Pseudo : ", this.pseudo);
          }
        });
      }
    });

    this.chatService.getMessages().subscribe(messages => {
      this.messages = messages;
      console.log(this.messages);
    });
  }

  sendMessage() {
    this.chatService.sendMessage(this.message, this.pseudo);
    this.message = '';
  }
}
