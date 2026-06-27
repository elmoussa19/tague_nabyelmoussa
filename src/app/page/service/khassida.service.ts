import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Khassida } from '../model/khassida';
import { Environment } from '../../evironments/environment';

@Injectable({
  providedIn: 'root'
})
export class KhassidaService {
  private apiUrl = Environment.ApiUrl+'/khassida';

  constructor(private http: HttpClient) {}

  // ✅ Lister les khassidas d’un auteur
  getKhassidasByAuteur(auteurId: number): Observable<Khassida[]> {
    return this.http.get<Khassida[]>(`${this.apiUrl}/${auteurId}`);
  }

  // ✅ Détail d’une khassida
  getKhassida(id: number): Observable<Khassida> {
    return this.http.get<Khassida>(`${this.apiUrl}/show/${id}`);
  }

  // ✅ Créer une khassida
  createKhassida(khassidaData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, khassidaData);
  }

  // ✅ Mettre à jour une khassida
updateKhassida(id: number, khassidaData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}?_method=PUT`, khassidaData);
}

  // ✅ Supprimer une khassida
  deleteKhassida(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
