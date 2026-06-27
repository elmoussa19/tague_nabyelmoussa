import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evenement } from '../model/evenements';
import { Environment } from '../../evironments/environment';

@Injectable({
  providedIn: 'root'
})
export class EvenementsService {
private apiUrl = Environment.ApiUrl + '/evenements';


  constructor(private http: HttpClient) {}

  // ✅ Lister tous les événements
  getEvenements(): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(this.apiUrl);
  }

  // ✅ Détail d’un événement
  getEvenement(id: number): Observable<Evenement> {
    return this.http.get<Evenement>(`${this.apiUrl}/${id}`);
  }

  // ✅ Créer un nouvel événement
  createEvenement(evenementData: FormData): Observable<Evenement> {
    return this.http.post<Evenement>(this.apiUrl, evenementData);
  }

  // ✅ Mettre à jour un événement
updateEvenement(id: number, evenementData: FormData): Observable<Evenement> {
    return this.http.post<Evenement>(`${this.apiUrl}/${id}?_method=PUT`, evenementData);
}

  // ✅ Supprimer un événement
  deleteEvenement(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
