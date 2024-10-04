import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import {catchError, finalize, switchMap} from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private db: AngularFireDatabase, private storage: AngularFireStorage) {}

  uploadFile(file: File): Observable<string> {
    const filePath = `uploads/${Date.now()}_${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    return task.snapshotChanges().pipe(
      finalize(() => {
        console.log('File uploaded to:', filePath);
      }),
      switchMap(() => fileRef.getDownloadURL().pipe(
        catchError(error => {
          console.error('Error retrieving file URL:', error);
          return of(null);
        })
      ))
    );
  }

  sendMessage(message: string, pseudo: string, fileUrl?: string) {
    if (!message.trim() && !fileUrl) {
      return Promise.reject(new Error('Message and file URL are both empty. Nothing to send.'));
    }

    const timestamp = Date.now();
    const messageData = {
      user: pseudo,
      text: message,
      fileUrl: fileUrl || null,
      timestamp: timestamp
    };

    return this.db.list('messages').push(messageData);
  }

  getMessages() {
    return this.db.list('/messages').valueChanges();
  }
}
