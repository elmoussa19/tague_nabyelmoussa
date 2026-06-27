import { Chanteur } from './chanteur';

export interface Gamou {
  id: number;
  titre: string;
  audio: string;
  auteur_id: number;
  auteur?: Chanteur;
  created_at?: string;
  updated_at?: string;
  duration?: number;
  currentTime?: number;
}
