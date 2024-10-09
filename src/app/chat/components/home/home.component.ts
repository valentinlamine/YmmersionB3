import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { ChatService } from '../../services/chat.service';
import {Router} from "@angular/router";

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
  memberList: string[] = [];
  memberListTmp: string = '';
  toRemove: string = '';
  message: string = '';
  messages: any[] = [];
  userGroups: any[] = [];
  userConv: any[] = [];
  members: any[] = [];
  selectedFile: File | null = null;
  enlargedImageUrl: string | null = null;

  errorMessage: string = '';

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

  @ViewChild('messageContainer') private messageContainer!: ElementRef;


// Fonction pour descendre la scrollbar après l'envoi du message
  private scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Scroll Error:', err);
    }
  }

  sendMessage() {
    console.log('sendMessage called');
    console.log('Message:', this.message);
    console.log('Selected File:', this.selectedFile);

    // Si l'input est vide et qu'aucun fichier n'est sélectionné, on ne fait rien
    if (!this.message.trim() && !this.selectedFile) {
      console.warn('Message and file are both empty. Nothing to send.');
      return;
    }

    // Si un fichier est sélectionné, envoyer le fichier puis le message
    if (this.selectedFile) {
      this.chatService.uploadFile(this.selectedFile).subscribe(url => {
        console.log('File URL:', url); // Log the file URL to verify
        this.chatService.sendMessage(this.message, this.pseudo, this.group, url).then(() => {
          console.log('Message sent with file');
          this.selectedFile = null;
          this.scrollToBottom(); // Scroll après envoi
        }).catch(error => {
          console.error('Error sending message:', error);
        });
      }, error => {
        console.error('File upload error:', error);
      });
    }
    // Si aucun fichier n'est sélectionné, envoyer uniquement le message
    else {
      this.chatService.sendMessage(this.message, this.pseudo, this.group).then(() => {
        console.log('Message sent');
        this.scrollToBottom(); // Scroll après envoi
      }).catch(error => {
        console.error('Error sending message:', error);
      });
    }
    this.message = '';
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

  // Method to handle image click
  enlargeImage(url: string): void {
    this.enlargedImageUrl = url;
  }

  // Method to close the enlarged image
  closeImage(): void {
    this.enlargedImageUrl = null;
  }

  removeGroup() {
    this.chatService.removeGroup(this.group);
    this.group = '';
    this.messages = [];
  }

  addGroup(){
    this.chatService.addGroup(this.name, this.pseudo)
  }

  addInGroupList() {
    if (this.memberListTmp === '') {
      this.errorMessage = 'Le pseudo ne peut pas être vide';
      this.showError();
      return;
    }
    if (this.memberList.includes(this.memberListTmp)) {
      this.errorMessage = 'Le pseudo est déjà dans la liste';
      this.showError();
      return;
    }
    this.chatService.checkPseudoExists(this.memberListTmp).subscribe(exist => {
      if (!exist) {
        this.errorMessage = 'Le pseudo n\'existe pas';
        this.showError();
        return
      } else {
        this.memberList.push(this.memberListTmp);
        this.memberListTmp = '';
      }
    });
  }

  removeInGroupList(name: string) {
    this.memberList = this.memberList.filter(item => item !== name);
  }

  addInGroup() {
    console.log(this.memberList);
    this.chatService.addInGroup(this.memberList, this.group, this.pseudo);
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

  getOtherParticipant(group: string) {
    return this.chatService.getOtherParticipant(group, this.pseudo);
  }

  isPopupAddInGroupVisible: boolean = false;
  togglePopupAddInGroup(): void {
    this.isPopupAddInGroupVisible = !this.isPopupAddInGroupVisible;
  }

  formatTimestamp(timestamp: number | Date): string {
    const messageDate = new Date(timestamp);
    const now = new Date();

    // Réinitialisation des heures/minutes/secondes pour comparer uniquement les jours
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

    // Calcul de la différence entre les dates en jours
    const diffInDays = Math.floor((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24));

    const timeString = messageDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Si c'est aujourd'hui
    if (diffInDays === 0) {
      return `Aujourd'hui à ${timeString}`;
    }

    // Si c'était hier
    if (diffInDays === 1) {
      return `Hier à ${timeString}`;
    }

    // Pour les jours plus anciens
    const dateString = messageDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `${dateString} à ${timeString}`;
  }

  isError: boolean = false;
  toggleError(): void {
    this.isError = !this.isError;
  }

  showError() {
    this.isError = true;
  }
}
