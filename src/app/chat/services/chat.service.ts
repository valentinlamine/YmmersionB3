import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import {catchError, finalize, map, switchMap} from 'rxjs/operators';
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

  sendMessage(message: string, pseudo: string, groupName: string, fileUrl?: string) {
    // Vérifier que le message et le groupe sont valides
    if (!message.trim() && !fileUrl) {
      return Promise.reject(new Error('Message and file URL are both empty. Nothing to send.'));
    }
    if (!groupName.trim()) {
      return Promise.reject(new Error('Group name is empty. Cannot send message without a group.'));
    }

    // Récupérer le groupId basé sur le nom du groupe
    return this.getGroupByName(groupName).pipe(
      switchMap(groupData => {
        if (groupData) {
          const groupId = groupData.key; // Récupérer l'ID du groupe

          // Construire l'objet de message
          const timestamp = Date.now();
          const messageData = {
            user: pseudo,
            text: message,
            fileUrl: fileUrl || null,
            timestamp: timestamp,
            groupId: groupId
          };

          // Sauvegarder le message dans la table 'messages'
          return this.db.list('messages').push(messageData)
            .then(() => console.log(`Message envoyé dans le groupe ${groupName}`))
            .catch(error => {
              console.error('Erreur lors de l\'envoi du message :', error);
              throw error;
            });

        } else {
          // Le groupe n'existe pas
          throw new Error(`Le groupe ${groupName} n'existe pas.`);
        }
      }),
      catchError(error => {
        console.error('Erreur dans sendMessage :', error);
        return Promise.reject(error);
      })
    ).toPromise();
  }

  getMessages(group: string, pseudo: string): Observable<any[]> {
    // Récupérer le groupId basé sur le nom du groupe
    return this.getGroupByName(group).pipe(
      switchMap(groupData => {
        if (groupData) {
          const { key, members } = groupData;

          // Vérifier si l'utilisateur est dans la liste des membres
          if (!members.includes(pseudo)) {
            console.log(`L'utilisateur ${pseudo} n'est pas membre du groupe ${group}.`);
            return of([]); // Renvoie un tableau vide si l'utilisateur n'est pas membre
          }

          // Filtrer les messages avec le groupId correspondant
          return this.db.list('/messages', ref => ref.orderByChild('groupId').equalTo(key)).valueChanges();
        } else {
          console.log('Aucun groupe trouvé');
          return of([]); // Renvoie un tableau vide si le groupe n'est pas trouvé
        }
      })
    );
  }

  getGroupByName(groupName: string): Observable<{ key: string, members: string[] }> {
    return this.db.list('groupes', ref => ref.orderByChild('name').equalTo(groupName))
      .snapshotChanges()
      .pipe(
        map(changes => {
          if (changes.length > 0) {
            const key = changes[0].key as string; // La clé du groupe
            const group = changes[0].payload.val() as { members: string }; // On suppose que 'members' est une chaîne

            // Les membres sont stockés sous forme de chaîne séparée par des virgules
            const members = group.members ? group.members.split(',') : [];

            return { key, members };
          } else {
            throw new Error('Groupe non trouvé');
          }
        })
      );
  }

  getUserGroups(pseudo: string): Observable<any[]> {
    return this.db.list('groupes')
      .snapshotChanges()
      .pipe(
        map(changes =>
          // On parcourt tous les groupes et on filtre ceux où le pseudo est dans 'members' et le type est 'conv'
          changes
            .map(c => ({ key: c.key, ...(c.payload.val() as any) }))
            .filter(group =>
              group.members && group.members.includes(pseudo) && group.type === 'group' // Vérifie si 'pseudo' est dans la liste 'members' et que le type est 'group'
            )
        )
      );
  }

  getUserConv(pseudo: string): Observable<any[]> {
    return this.db.list('groupes')
      .snapshotChanges()
      .pipe(
        map(changes =>
          // On parcourt tous les groupes et on filtre ceux où le pseudo est dans 'members' et le type est 'conv'
          changes
            .map(c => ({ key: c.key, ...(c.payload.val() as any) }))
            .filter(group =>
              group.members && group.members.includes(pseudo) && group.type === 'conv' // Vérifie si 'pseudo' est dans la liste 'members' et que le type est 'conv'
            )
        )
      );
  }

  getOtherParticipant(conversationName: string, pseudo: string): string | null {
    // On sépare les noms en utilisant la virgule
    const names = conversationName.split(', ').map(name => name.trim());

    // On filtre pour obtenir le nom qui n'est pas le pseudo
    const otherName = names.find(name => name !== pseudo);

    // Si on a trouvé un autre nom, on le retourne, sinon on retourne null
    return otherName || null;
  }

  addGroup(name: string, pseudo: string) {
    this.checkGroupExists(name).subscribe(exists => {
      if (exists) {
        console.log("groupe existe déjà");
        return
      }
    });

    this.checkPseudoExists(pseudo).subscribe(exists => {
      if (!exists) {
        console.log("pseudo introuvable");
        return
      }
    });
    const groupId = this.db.createPushId();
    const groupData = {
      name: name,
      members: pseudo,
      type: "group",
      createdAt: Date.now()
    };
    console.log("création terminée");
    return this.db.object(`groupes/${groupId}`).set(groupData);
  }

  addInGroup(toAdd: string, name: string, pseudo: string) {
    // Vérifie si le pseudo existe avant de l'ajouter
    this.checkPseudoExists(toAdd).subscribe(exists => {
      if (!exists) {
        console.log("pseudo introuvable");
        return;
      } else {
        // Si le pseudo existe, on peut poursuivre l'ajout dans le groupe
        this.checkGroupExists(name).subscribe(groupExists => {
          if (!groupExists) {
            console.log("groupe existe pas encore, tentative de création");
            this.addGroup(name, pseudo).then(() => {
              // Après création, ajouter le pseudo "toAdd"
              this.addPseudoToGroup(toAdd, name);
            });
          } else {
            // Le groupe existe, on peut directement ajouter le pseudo
            this.addPseudoToGroup(toAdd, name);
          }
        });
      }
    });
  }

  addConv(toAdd: string, pseudo: string) {
    // Vérifie si le pseudo existe avant de l'ajouter
    this.checkPseudoExists(toAdd).subscribe(exists => {
      if (!exists) {
        console.log("pseudo introuvable");
        return;
      } else {
        // Si le pseudo existe, on peut poursuivre l'ajout dans le groupe
        this.checkGroupExists(toAdd + ", " + pseudo).subscribe(groupExists => {
          if (!groupExists) {
            const groupId = this.db.createPushId();
            const groupData = {
              name: toAdd + ", " + pseudo,
              members: pseudo,
              type: "conv",
              createdAt: Date.now()
            };
            console.log("création terminée");
            return this.db.object(`groupes/${groupId}`).set(groupData).then(() => {
              this.addPseudoToGroup(toAdd, toAdd + ", " + pseudo);
            });
          } else {
            console.log("groupe existe pas encore, tentative de création");
            return
          }
        });
      }
    });
  }

  // Ajoute un pseudo à la liste des membres d'un groupe en le mettant à jour
  addPseudoToGroup(toAdd: string, groupName: string) {
    this.getGroupByName(groupName).subscribe(groupData => {
      if (groupData) {
        const { key, members } = groupData;
        if (!members.includes(toAdd)) {
          members.push(toAdd);
          const updatedMembers = members.join(','); // Les membres sont stockés sous forme de chaîne séparée par des virgules
          this.db.object(`groupes/${key}`).update({ members: updatedMembers })
            .then(() => console.log(`Pseudo ${toAdd} ajouté au groupe ${groupName}`))
            .catch(error => console.error("Erreur lors de l'ajout du pseudo:", error));
        } else {
          console.log(`Pseudo ${toAdd} est déjà dans le groupe ${groupName}`);
        }
      } else {
        console.error(`Groupe ${groupName} introuvable`);
      }
    });
  }

  checkPseudoExists(toAdd: string): Observable<boolean> {
    return this.db.list('users', ref => ref.orderByChild('pseudo').equalTo(toAdd))
      .snapshotChanges()
      .pipe(
        map(changes => changes.length > 0)
      );
  }

  checkGroupExists(name: string): Observable<boolean> {
    return this.db.list('groupes', ref => ref.orderByChild('name').equalTo(name))
      .snapshotChanges()
      .pipe(
        map(changes => changes.length > 0)
      );
  }

  removeInGroup(toRemove: string, groupName: string) {
    console.log("Remove in group ACTION ON : " + groupName);
    return this.getGroupByName(groupName).pipe(
      switchMap(groupData => {
        if (groupData) {
          const { key, members } = groupData;

          // Vérifier si l'utilisateur à retirer existe dans la liste des membres
          const index = members.indexOf(toRemove);
          if (index !== -1) {
            // Enlever l'utilisateur de la liste
            members.splice(index, 1);
            const updatedMembers = members.join(','); // Mise à jour des membres sous forme de chaîne séparée par des virgules

            // Mettre à jour la base de données
            return this.db.object(`groupes/${key}`).update({ members: updatedMembers })
              .then(() => {
                console.log(`${toRemove} a été enlevé du groupe ${groupName}.`);
              })
              .catch(error => {
                console.error('Erreur lors de la mise à jour du groupe :', error);
                throw error;
              });
          } else {
            console.log(`${toRemove} n'est pas membre du groupe ${groupName}.`);
            return of(null);
          }
        } else {
          console.log(`Groupe ${groupName} introuvable.`);
          return of(null);
        }
      }),
      catchError(error => {
        console.error('Erreur dans removeInGroup :', error);
        return of(null);
      })
    ).toPromise();
  }

  // Supprimer un groupe de la base de données
  removeGroup(groupName: string) {
    return this.getGroupByName(groupName).pipe(
      switchMap(groupData => {
        if (groupData) {
          const { key } = groupData;

          // Supprimer le groupe de la base de données
          return this.db.object(`groupes/${key}`).remove()
            .then(() => {
              console.log(`Groupe ${groupName} supprimé avec succès.`);
            })
            .catch(error => {
              console.error('Erreur lors de la suppression du groupe :', error);
              throw error;
            });
        } else {
          console.log(`Groupe ${groupName} introuvable.`);
          return of(null);
        }
      }),
      catchError(error => {
        console.error('Erreur dans removeGroup :', error);
        return of(null);
      })
    ).toPromise();
  }

}
