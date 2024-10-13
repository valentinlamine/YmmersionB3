import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { ChatService } from '../../services/chat.service';
import {Router} from "@angular/router";
import {animation} from "@angular/animations";
import firebase from "firebase/compat/app";
import {lastValueFrom, Subject, Subscription, takeUntil} from "rxjs";
import {switchMap, take} from "rxjs/operators";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  user: any;
  pseudo: string = '';
  group: string = '';
  groupName: string = '';
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
  imagePreviewUrl: string | null = null;
  enlargedImageUrl: string | null = null;
  showConfirmationPopup: boolean = false;
  groupToRemove: string = '';

  errorMessage: string = '';

  private destroy$ = new Subject<void>();
  messageSub: Subscription = new Subscription();
  membersSub: Subscription = new Subscription();
  viewSub: Subscription = new Subscription();

  constructor(
    private afAuth: AngularFireAuth,
    private chatService: ChatService,
    private db: AngularFireDatabase,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.user = user.uid;

        this.db.object(`users/${this.user}`).valueChanges().subscribe((userData: any) => {
          if (userData) {
            this.pseudo = userData.pseudo;
            console.log('Group1:', this.group);

            // Récupérer les groupes auxquels l'utilisateur appartient
            this.chatService.getUserGroups(this.pseudo).subscribe(groups => {
              this.userGroups = groups;
              console.log("User groups: ", this.userGroups);
              if (this.userGroups.length > 0 && this.group == '') {
                this.changeGroup(this.userGroups[0].name);
                console.log('Group2:', this.group);
              }
            });
            console.log('Group3:', this.group);

            this.chatService.getUserConv(this.pseudo).subscribe(conv => {
              this.userConv = conv;
              console.log("User conversations: ", this.userConv);

              // Check if there are any conversations and set the first one as the active conversation
              if (this.userConv.length > 0 && this.group == '') {
                this.changeGroup(this.userConv[0].name);
              }
            });
          }
        });
      }
    });

    // Charger les messages du groupe par défaut
    if (this.group) {
      this.chatService.getMessages(this.group, this.pseudo).subscribe(messages => {
        this.messages = messages;
        console.log("On est dans le oninit" + this.messages);
      });
    }
  }

  ngOnDestroy(): void {
    // Compléter le sujet pour se désabonner
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRemovedFromGroup() {
    console.log('Vous etes mort');
    // Réinitialiser le groupe courant
    this.group = '';
    this.messages = [];
    this.members = [];

    // Optionnel : naviguer vers un autre groupe ou une autre vue
    this.chatService.getUserGroups(this.pseudo).subscribe(groups => {
      this.userGroups = groups;
      if (this.userGroups.length > 0) {
        this.changeGroup(this.userGroups[0].name); // Changer vers le premier groupe disponible
      } else {
        console.log('Vous n\'êtes plus dans aucun groupe.');
        // Optionnel : Naviguer vers une autre vue ou afficher un message
      }
    });
  }

  async changeGroup(groupName: string): Promise<void> {
    let id;
    try {
      this.messageSub.unsubscribe();
      this.membersSub.unsubscribe();
      this.viewSub.unsubscribe();
      this.group = groupName;
      console.log(`Group changed to: ${this.group}`);

      // Charger les membres du groupe avec un seul abonnement
      this.membersSub = this.loadMembers();
      id = '';
      await this.chatService.getGroupIdByName(this.group)
        .then(groupId => {
          if (groupId) {
            id = groupId;
            console.log(`L'ID du groupe est: ${groupId}`);
          } else {
            console.log('Aucun groupe trouvé.');
          }
        })
        .catch(error => {
          console.error('Erreur lors de la récupération de l\'ID du groupe:', error);
        });

      this.viewSub = this.db.object(`groupes/${id}/members`).snapshotChanges().subscribe(snapshot => {
        const members = snapshot.payload.val(); // Récupérer les données de Firebase

        if (members) {
          console.log('Members data:', members);

          if (typeof members === 'string') {
            // Convertir la chaîne en tableau en utilisant la virgule comme séparateur
            const memberList = members.split(',').map(member => member.trim());
            console.log('Member list:', memberList);

            if (!memberList.includes(this.pseudo)) {
              console.log('Vous avez été supprimé du groupe.');
              this.onRemovedFromGroup(); // Gérer le cas où l'utilisateur est supprimé
            }
          } else {
            console.error('Erreur : La liste des membres n\'est pas une chaîne.', members);
          }
        } else {
          console.error('Erreur : Aucun membre trouvé pour ce groupe.');
        }
      });

      // Écouter les messages en continu
      this.messageSub = this.chatService.getMessages(this.group, this.pseudo).pipe(
        // Utiliser takeUntil pour se désabonner à la destruction ou à d'autres événements
      ).subscribe(
        messages => {
          this.messages = messages;
          console.log(this.messages);
        },
        error => {
          console.error('Erreur lors du chargement des messages :', error);
        }
      );

    } catch (error) {
      console.error('Erreur dans changeGroup:', error);
    }
  }

  async renameGroup() {
    try {
      const groupType = await this.chatService.getType(this.group);
      if (groupType == "conv") {
        console.log(`Mauvais type trouvé pour le groupe ${this.group}.`);
      } else {
        await this.chatService.renameGroup(this.group, this.groupName);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du type de groupe:', error);
    }
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrl = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  loadMembers(): Subscription {
    return this.chatService.getMembers(this.group).pipe(
      ).subscribe(
        members => {
          this.members = members;
          console.log('Members:', this.members);
        },
      );
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

  async sendMessage() {
    console.log('sendMessage called');
    console.log('Message:', this.message);
    console.log('Selected File:', this.selectedFile);

    try {
      // Si le message et le fichier sont vides, ne rien envoyer
      if (!this.message.trim() && !this.selectedFile) {
        console.warn('Message and file are both empty. Nothing to send.');
        return;
      }

      // Si un fichier est sélectionné, téléchargez le fichier avant d'envoyer le message
      if (this.selectedFile) {
        const url = await lastValueFrom(this.chatService.uploadFile(this.selectedFile));
        console.log('File URL:', url); // Vérifier l'URL du fichier

        await this.chatService.sendMessage(this.message, this.pseudo, this.group, url);
        console.log('Message sent with file');

        // Réinitialiser le fichier sélectionné et l'URL de prévisualisation après l'envoi
        this.selectedFile = null;
        this.imagePreviewUrl = null;
      } else {
        // Si aucun fichier n'est sélectionné, envoyer uniquement le message
        await this.chatService.sendMessage(this.message, this.pseudo, this.group);
        console.log('Message sent');
      }

      // Nettoyer le champ de message après envoi et faire défiler en bas
      this.message = '';
      this.scrollToBottom(); // Faire défiler après l'envoi
    } catch (error) {
      // Gérer les erreurs lors de l'envoi du message ou du téléchargement du fichier
      console.error('Error sending message:', error);
    }
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
  enlargeImage(url: string | null): void {
    this.enlargedImageUrl = url;
  }

  async addGroup(): Promise<void> {
    if (!this.name || !this.pseudo) {
      console.warn('Le nom du groupe ou le pseudo est manquant.');
      return;
    }

    try {
      // Appeler le service pour ajouter le groupe
      await this.chatService.addGroup(this.name, this.pseudo);
      console.log(`Groupe ${this.name} ajouté avec succès.`);

      // Réinitialiser le champ du nom après l'ajout
      this.name = '';

    } catch (error) {
      // Gestion des erreurs en cas d'échec
      console.error('Erreur lors de l\'ajout du groupe :', error);
      this.errorMessage = 'Une erreur est survenue lors de l\'ajout du groupe.';
      this.showError(); // Optionnel : Montre une alerte ou un message d'erreur à l'utilisateur
    }
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

  async addInGroup() {
    console.log(this.memberList);

    try {
      const groupType = await this.chatService.getType(this.group);
      if (groupType == "conv") {
        console.log(`Mauvais type trouvé pour le groupe ${this.group}.`);
      } else {
        await this.chatService.addInGroup(this.memberList, this.group, this.pseudo);
        if (this.memberList.length === 0) {
          this.errorMessage = 'La liste ne peut pas être vide';
          this.showError();
          return;
        }
        return
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du type de groupe:', error);
    }
    this.memberList = [];
  }

  async addConv(): Promise<void> {
    if (!this.toConv || !this.pseudo) {
      console.warn('Le nom du groupe ou le pseudo est manquant.');
      return;
    }

    try {
      // Appeler le service pour ajouter le groupe
      await this.chatService.addConv(this.toConv, this.pseudo);
      console.log(`Conv ${this.name} ajouté avec succès.`);

      // Réinitialiser le champ du nom après l'ajout
      this.toConv = '';

    } catch (error) {
      // Gestion des erreurs en cas d'échec
      console.error('Erreur lors de l\'ajout de la conv :', error);
      this.errorMessage = 'Une erreur est survenue lors de l\'ajout de la conv.';
      this.showError(); // Optionnel : Montre une alerte ou un message d'erreur à l'utilisateur
    }
  }

  removeInGroup(pseudo: string) {
    this.chatService.removeInGroup(pseudo, this.group);
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

  showError() {
    if (!this.isError) {
      this.isError = true;
      setTimeout(() => {
        this.isError = false; // L'erreur disparaîtra après 4 secondes
      }, 4000);
    }
  }

  // Fonction pour afficher la popup avec le groupe à supprimer
  confirmRemoveGroup(groupName: string): void {
    this.groupToRemove = groupName;
    this.showConfirmationPopup = true;
  }

  // Fonction pour annuler la suppression
  cancelRemove(): void {
    this.showConfirmationPopup = false;
    this.groupToRemove = '';
  }

  // Fonction pour confirmer la suppression
  async confirmRemove(): Promise<void> {
    if (this.groupToRemove) {
      // Supprimer le groupe de Firebase
      await this.chatService.removeInGroup(this.pseudo, this.groupToRemove).then(() => {
        console.log(`Groupe ${this.groupToRemove} supprimé avec succès.`);

        // Mettre à jour l'état local pour refléter la suppression
        this.userGroups = this.userGroups.filter(group => group.key !== this.groupToRemove);

        // Réinitialiser les autres propriétés liées au groupe
        this.group = '';
        this.messages = [];
        this.members = [];

        // Fermer la pop-up de confirmation
        this.showConfirmationPopup = false;

        // Optionnel : vous pouvez également vous désabonner d'éventuels observables ici
        // si vous avez mis en place des abonnements qui peuvent créer des effets indésirables
      }).catch(error => {
        console.error('Erreur lors de la suppression du groupe: ', error);
        this.errorMessage = 'Une erreur est survenue lors de la suppression du groupe.';
        this.showError();
      });
    } else {
      // Si aucun groupe n'est sélectionné
      console.warn('Aucun groupe sélectionné pour la suppression.');
    }
  }
}
