import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private db: AngularFireDatabase) {}

  sendMessage(text: string, user: any) {
    this.db.list('/messages').push({
      user,
      text,
      createdAt: new Date().toString()
    });
  }

  getMessages() {
    return this.db.list('/messages').valueChanges();
  }
}
