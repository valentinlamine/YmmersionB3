import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { ChatService } from '../../services/chat.service';
import {Router} from "@angular/router";
import {Observable} from "rxjs";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  user: any;
  pseudo: string = '';
  group: string = '';
  name: string = '';
  toConv: string = '';
  toAdd: string = '';
  toRemove: string = '';
  message: string = '';
  messages: any[] = [];
  userGroups: any[] = [];
  userConv: any[] = [];
  members: any[] = [];
  selectedFile: File | null = null;

  constructor(
    private afAuth: AngularFireAuth,
    private chatService: ChatService,
    private db: AngularFireDatabase,
    private router: Router
  ) {}

  ngOnInit() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.user = user.uid;
        console.log("User ID: ", this.user);

        this.db.object(`users/${this.user}`).valueChanges().subscribe((userData: any) => {
          if (userData) {
            this.pseudo = userData.pseudo;
            console.log("Pseudo: ", this.pseudo);

            // Récupérer les groupes auxquels l'utilisateur appartient
            this.chatService.getUserGroups(this.pseudo).subscribe(groups => {
              this.userGroups = groups;
              console.log("User groups: ", this.userGroups);
            });

            this.chatService.getUserConv(this.pseudo).subscribe(conv => {
              this.userConv = conv;
              console.log("User conversations: ", this.userConv);
            });
          }
        });
      }
    });

    // Charger les messages du groupe par défaut
    if (this.group) {
      this.chatService.getMessages(this.group, this.pseudo).subscribe(messages => {
        this.messages = messages;
        console.log(this.messages);
      });
    }
  }

  changeGroup(groupName: string) {
    this.group = groupName;
    console.log(`Group changed to: ${this.group}`);

    this.loadMembers();
    // Recharger les messages du nouveau groupe
    this.chatService.getMessages(this.group, this.pseudo).subscribe(messages => {
      this.messages = messages;
      console.log(this.messages);
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  loadMembers() {
    if (this.group) { // Assurez-vous qu'un groupe est sélectionné
      this.chatService.getMembers(this.group).subscribe(members => {
        this.members = members; // Mettre à jour la variable members
        console.log("Members of group:", this.members);
      }, error => {
        console.error('Error loading members:', error);
      });
    }
  }

  sendMessage() {
    console.log('sendMessage called');
    console.log('Message:', this.message);
    console.log('Selected File:', this.selectedFile);

    if (!this.message.trim() && !this.selectedFile) {
      console.warn('Message and file are both empty. Nothing to send.');
      return;
    }

    if (this.selectedFile) {
      this.chatService.uploadFile(this.selectedFile).subscribe(url => {
        console.log('File URL:', url); // Log the file URL to verify
        this.chatService.sendMessage(this.message, this.pseudo, this.group, url).then(() => {
          console.log('Message sent with file');
          this.message = '';
          this.selectedFile = null;
        }).catch(error => {
          console.error('Error sending message:', error);
        });
      }, error => {
        console.error('File upload error:', error);
      });
    } else {
      this.chatService.sendMessage(this.message, this.pseudo, this.group).then(() => {
        console.log('Message sent without file');
        this.message = '';
      }).catch(error => {
        console.error('Error sending message:', error);
      });
    }
    this.message = "";
    this.selectedFile = null;
  }

  isImageFile(fileUrl: string): boolean {
    const isImage = /\.(jpeg|jpg|gif|png)(\?.*)?$/i.test(fileUrl);
    console.log(`isImageFile: ${fileUrl} -> ${isImage}`);
    return isImage;
  }

  isVideoFile(fileUrl: string): boolean {
    const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(fileUrl);
    console.log(`isVideoFile: ${fileUrl} -> ${isVideo}`);
    return isVideo;
  }

  isAudioFile(fileUrl: string): boolean {
    const isAudio = /\.(mp3|wav|ogg)(\?.*)?$/i.test(fileUrl);
    console.log(`isAudioFile: ${fileUrl} -> ${isAudio}`);
    return isAudio;
  }

  removeGroup() {
    this.chatService.removeGroup(this.group);
    this.group = '';
    this.messages = [];
  }

  addGroup(){
    this.chatService.addGroup(this.name, this.pseudo)
  }

  addInGroup() {
    this.chatService.addInGroup(this.toAdd, this.group, this.pseudo);
  }

  addConv() {
    this.chatService.addConv(this.toConv, this.pseudo)
  }

  removeInGroup() {
    this.chatService.removeInGroup(this.toRemove, this.group);
  }

  signOut() {
    this.afAuth.signOut().then(result => {
      console.log('User signed out:', result);
      this.router.navigateByUrl('/auth/login')
    })
  }

  // Variable pour contrôler la visibilité du conteneur de droite
  isContainerVisible = false;
  toggleContainer() {
    this.isContainerVisible = !this.isContainerVisible;
  }

  // Variable pour contrôler la visibilité de la pop-up
  isPopupVisible: boolean = false;
  togglePopup(): void {
    this.isPopupVisible = !this.isPopupVisible;
  }
}
