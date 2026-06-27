import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Galerie } from '../model/galerie';
import { Environment } from '../../evironments/environment';

@Injectable({
  providedIn: 'root'
})
export class GalerieService {
  private apiUrl = Environment.ApiUrl+'/galeries';

  constructor(private http: HttpClient) {}

  // ✅ Lister toutes les images de la galerie
  getGaleries(): Observable<Galerie[]> {
    return this.http.get<Galerie[]>(this.apiUrl);
  }

  // ✅ Détail d’une image
  getGalerie(id: number): Observable<Galerie> {
    return this.http.get<Galerie>(`${this.apiUrl}/${id}`);
  }

  // ✅ Créer une nouvelle image
  createGalerie(galerieData: FormData): Observable<{ message: string; galerie: Galerie }> {
    return this.http.post<{ message: string; galerie: Galerie }>(this.apiUrl, galerieData);
  }

  // ✅ Mettre à jour une image
updateGalerie(id: number, galerieData: FormData): Observable<{ message: string; galerie: Galerie }> {
    return this.http.post<{ message: string; galerie: Galerie }>(`${this.apiUrl}/${id}?_method=PUT`, galerieData);
}

  // ✅ Supprimer une image
  deleteGalerie(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
