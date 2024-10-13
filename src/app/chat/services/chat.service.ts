import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import {catchError, concatMap, finalize, map, switchMap, take} from 'rxjs/operators';
import {from, lastValueFrom, Observable, of} from 'rxjs';
import { Group } from '../models/group.model';

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

  async sendMessage(message: string, pseudo: string, groupName: string, fileUrl?: string): Promise<void> {
    try {
      // Vérifier que le message ou le fichier ne sont pas vides
      if (!message.trim() && !fileUrl) {
        throw new Error('Message and file URL are both empty. Nothing to send.');
      }

      // Vérifier que le nom du groupe est valide
      if (!groupName.trim()) {
        throw new Error('Group name is empty. Cannot send message without a group.');
      }

      // Récupérer les données du groupe via le nom
      const groupData = await this.getGroupByName(groupName).pipe(take(1)).toPromise();

      if (!groupData) {
        throw new Error(`The group ${groupName} does not exist.`);
      }

      // Récupérer l'ID du groupe
      const groupId = groupData.key;

      // Construire l'objet du message
      const timestamp = Date.now();
      const messageData = {
        user: pseudo,
        text: message || '', // Si le message est vide mais le fichier est présent
        fileUrl: fileUrl || null,
        timestamp,
        groupId
      };

      // Sauvegarder le message dans la base de données (Firebase)
      await this.db.list('messages').push(messageData);
      console.log(`Message sent to group ${groupName}`);

    } catch (error) {
      console.error('Error while sending the message:', error);
      throw error;
    }
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

  getGroupByName(groupName: string): Observable<{ key: string, members: string[], type: string }> {
    return this.db.list('groupes', ref => ref.orderByChild('name').equalTo(groupName))
      .snapshotChanges()
      .pipe(
        map(changes => {
          if (changes.length > 0) {
            const key = changes[0].key as string; // La clé du groupe
            const group = changes[0].payload.val() as { members: string, type: string }; // On suppose que 'members' et 'type' sont présents

            // Les membres sont stockés sous forme de chaîne séparée par des virgules
            const members = group.members ? group.members.split(',') : [];

            // Retourne la clé, les membres et le type
            return { key, members, type: group.type }; // Ajout du type ici
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

  getMembers(groupName: string): Observable<string[]> {
    return this.db.list<Group>('groupes', ref => ref.orderByChild('name').equalTo(groupName)).snapshotChanges().pipe(
      map(changes => {
        if (changes.length > 0) {
          const groupData = changes[0].payload.val() as Group; // Type assertion

          // Vérifier que les membres existent et les retourner sous forme de tableau
          return groupData.members ? groupData.members.split(',') : [];
        } else {
          console.warn(`Aucun groupe trouvé avec le nom ${groupName}`);
          return []; // Retourner un tableau vide si aucun groupe n'est trouvé
        }
      }),
      catchError(error => {
        console.error(`Erreur lors de la récupération des membres du groupe ${groupName}:`, error);
        return of([]); // Retourner un tableau vide en cas d'erreur
      })
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

  async addGroup(name: string, pseudo: string): Promise<void> {
    try {
      const groupExists = await this.checkGroupExists(name).pipe(take(1)).toPromise();

      if (groupExists) {
        console.log("Le groupe existe déjà.");
        return;
      }

      const pseudoExists = await this.checkPseudoExists(pseudo).pipe(take(1)).toPromise();

      if (!pseudoExists) {
        console.log("Pseudo introuvable.");
        return;
      }

      const groupId = this.db.createPushId();
      const groupData = {
        name: name,
        members: pseudo,
        type: "group",
        createdAt: Date.now()
      };

      await this.db.object(`groupes/${groupId}`).set(groupData);
      console.log("Création terminée.");

    } catch (error) {
      console.error("Erreur lors de la création du groupe : ", error);
    }
  }

  async addInGroup(memberList: string[], groupName: string, pseudo: string): Promise<void> {
    try {
      // Transforme le tableau de membres en un flux d'observables
      await from(memberList).pipe(
        // Pour chaque membre, vérifie si le pseudo existe
        concatMap(member =>
          this.checkPseudoExists(member).pipe(
            take(1), // Limite à une seule émission
            switchMap(exists => {
              if (!exists) {
                console.log(`Pseudo ${member} introuvable`);
                return of(null); // Retourne un observable vide si le pseudo n'existe pas
              }

              // Si le pseudo existe, vérifie si le groupe existe
              return this.checkGroupExists(groupName).pipe(
                take(1), // Limite à une seule émission
                switchMap(groupExists => {
                  if (groupExists) {
                    // Si le groupe existe, ajoute le pseudo dans le groupe
                    return from(this.addPseudoToGroup(member, groupName)); // Retourne une promesse convertie en observable
                  } else {
                    console.log(`Groupe ${groupName} introuvable`);
                    return of(null); // Retourne un observable vide si le groupe n'existe pas
                  }
                })
              );
            })
          )
        )
      ).toPromise(); // Convertit en promesse pour pouvoir gérer avec `async/await`

      console.log('Ajout de tous les membres terminé.');
    } catch (err) {
      console.error('Erreur lors de l\'ajout des membres :', err);
    }
  }

  async addConv(toAdd: string, pseudo: string): Promise<void> {
    try {
      const pseudoExists = await this.checkPseudoExists(toAdd).pipe(take(1)).toPromise();

      if (!pseudoExists) {
        console.log("Pseudo introuvable.");
        return;
      }

      const convName = `${toAdd}, ${pseudo}`;
      const convExists = await this.checkGroupExists(convName).pipe(take(1)).toPromise();

      if (!convExists) {
        const groupId = this.db.createPushId();
        const groupData = {
          name: convName,
          members: pseudo,
          type: "conv",
          createdAt: Date.now()
        };

        await this.db.object(`groupes/${groupId}`).set(groupData);
        console.log("Conversation créée.");

        // Ajouter l'utilisateur dans la conversation
        await this.addPseudoToGroup(toAdd, convName);
      } else {
        console.log("La conversation existe déjà.");
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la conversation : ", error);
    }
  }

  // Ajoute un pseudo à la liste des membres d'un groupe en le mettant à jour
  async addPseudoToGroup(toAdd: string, groupName: string) {
    // Récupérer les informations du groupe de manière sûre avec un seul abonnement
    this.getGroupByName(groupName).pipe(
      take(1), // Prend seulement la première émission, puis se désabonne automatiquement
      switchMap(groupData => {
        if (groupData) {
          const { key, members } = groupData;

          // Vérifier si le pseudo est déjà dans la liste des membres
          if (!members.includes(toAdd)) {
            members.push(toAdd); // Ajouter le nouveau membre

            // Reconversion en chaîne séparée par des virgules
            const updatedMembers = members.join(',');

            // Mettre à jour les membres dans la base de données
            return this.db.object(`groupes/${key}`).update({ members: updatedMembers }).then(() => {
              console.log(`Pseudo ${toAdd} ajouté au groupe ${groupName}`);
            });
          } else {
            console.log(`Pseudo ${toAdd} est déjà dans le groupe ${groupName}`);
            return of(null); // Retourne un Observable vide pour ne rien faire
          }
        } else {
          console.error(`Groupe ${groupName} introuvable`);
          return of(null); // Groupe introuvable, ne rien faire
        }
      })
    ).subscribe({
      next: () => console.log('Mise à jour terminée.'),
      error: err => console.error('Erreur lors de l\'ajout du pseudo :', err)
    });
  }

  InGroup(toAdd: string, groupName: string): Observable<boolean> {
    return this.getGroupByName(groupName).pipe(take(1), map(groupData => {
        if (groupData) {
          const {members} = groupData;
          // Vérifier si le pseudo est déjà dans la liste des membres
          return members.includes(toAdd);
        }
        return false;
      })
    );
  }

  checkPseudoExists(toAdd: string): Observable<boolean> {
    return this.db.list('users', ref => ref.orderByChild('pseudo').equalTo(toAdd))
      .snapshotChanges()
      .pipe(
        map(changes => changes.length > 0)
      );
  }

  checkGroupExists(groupName: string): Observable<boolean> {
    return this.db.list('groupes', ref => ref.orderByChild('name').equalTo(groupName))
      .snapshotChanges()
      .pipe(
        map(changes => changes.length > 0) // Retourne `true` si au moins un groupe correspond
      );
  }

  renameGroup(oldName: string, newName: string) {
    this.getGroupByName(oldName).pipe(take(1)).subscribe(groupData => {
      if (groupData) {
        const {key} = groupData;
        this.db.object(`groupes/${key}`).update({name: newName})
          .then(() => {
            console.log(`Groupe ${oldName} renommé en ${newName}`);
          })
          .catch(error => {
            console.error('Erreur lors du renommage du groupe :', error);
          });
      } else {
        console.log(`Groupe ${oldName} introuvable pour le renommage.`);
      }
    });
  }

  getType(groupName: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.getGroupByName(groupName).pipe(
        take(1) // Limiter à une seule émission
      ).subscribe(
        groupData => {
          if (groupData && groupData.type) {
            resolve(groupData.type); // Retourner le type du groupe
          } else {
            resolve(null); // Retourner null si aucun type n'est trouvé
          }
        },
        error => {
          console.error('Erreur lors de la récupération du type de groupe :', error);
          reject(error); // Rejeter la promesse en cas d'erreur
        }
      );
    });
  }

  async removeInGroup(toRemove: string, groupName: string): Promise<void> {
    console.log("Remove in group ACTION ON: " + groupName);

    try {
      // Récupère les données du groupe en se désabonnant après la première émission
      const groupData = await lastValueFrom(this.getGroupByName(groupName).pipe(take(1)));

      if (groupData) {
        const { key, members, type } = groupData; // Extraction des données du groupe

        // Vérifier si l'utilisateur à retirer existe dans la liste des membres
        const index = members.indexOf(toRemove);
        if (index !== -1) {
          // Enlever l'utilisateur de la liste des membres
          members.splice(index, 1);

          // Reconvertir en chaîne pour sauvegarder dans Firebase
          const updatedMembers = members.join(',');

          // Mettre à jour la liste des membres dans Firebase
          await this.db.object(`groupes/${key}`).update({ members: updatedMembers });
          console.log(`${toRemove} a été enlevé du groupe ${groupName}.`);

          // Vérifier si le groupe est vide après le retrait
          if (members.length === 0) {
            // Supprimer le groupe s'il est vide
            await this.removeGroup(groupName);
            console.log(`Le groupe ${groupName} a été supprimé car il est vide.`);
            return;
          }

          // Si le groupe est de type "conv" et qu'il ne reste qu'une seule personne
          if (type === "conv" && members.length === 1) {
            await this.removeGroup(groupName);
            console.log(`Le groupe ${groupName} a été supprimé car il ne reste qu'une personne.`);
            return;
          }
        } else {
          console.log(`${toRemove} n'est pas membre du groupe ${groupName}.`);
        }
      } else {
        console.log(`Groupe ${groupName} introuvable.`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du membre du groupe :', error);
    }
  }

// Nouvelle méthode pour supprimer le groupe et ses messages
  async removeGroup(groupName: string) {
    return this.getGroupByName(groupName).pipe(
      take(1),
      switchMap(groupData => {
        if (groupData) {
          const { key } = groupData;

          // Supprimer les messages associés à ce groupe
          return this.db.list('messages', ref => ref.orderByChild('groupId').equalTo(key)).remove()
            .then(async () => {
              console.log(`Messages du groupe ${groupName} supprimés.`);
              // Supprimer le groupe de la base de données
              await this.db.object(`groupes/${key}`).set(null)
                .then(() => {
                  console.log(`Groupe ${groupName} supprimé avec succès.`);
                });
            })
            .catch(error => {
              console.error('Erreur lors de la suppression des messages :', error);
              throw error;
            });
        } else {
          console.log(`Groupe ${groupName} introuvable pour la suppression.`);
          return Promise.resolve(); // Groupe introuvable, on résout simplement
        }
      }),
      catchError(error => {
        console.error('Erreur dans removeGroupAndMessages :', error);
        return Promise.reject(error);
      })
    ).toPromise();
  }
}
