import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Gamou } from '../model/gamou';
import { Environment } from '../../evironments/environment';

@Injectable({
  providedIn: 'root'
})
export class GamouService {
  private apiUrl = Environment.ApiUrl+'/gamou';

  constructor(private http: HttpClient) {}

  // ✅ Lister les gamous d’un auteur
  getGamousByAuteur(auteurId: number): Observable<Gamou[]> {
    return this.http.get<Gamou[]>(`${this.apiUrl}/${auteurId}`);
  }

  // ✅ Détail d’un gamou
  getGamou(id: number): Observable<Gamou> {
    return this.http.get<Gamou>(`${this.apiUrl}/show/${id}`);
  }

  // ✅ Créer un gamou
  createGamou(gamouData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, gamouData);
  }

  // ✅ Mettre à jour un gamou
updateGamou(id: number, gamouData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}?_method=PUT`, gamouData);
}

  // ✅ Supprimer un gamou
  deleteGamou(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
