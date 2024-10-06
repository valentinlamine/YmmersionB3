export interface Group {
  createdAt: Date;
  members: string;       // Chaîne de caractères contenant les membres séparés par des virgules
  name: string;           // Nom du groupe
  type: string;
}
