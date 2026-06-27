import { Chanteur } from './chanteur';

export interface Khilass {
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
