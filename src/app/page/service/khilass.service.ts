import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Khilass } from '../model/khilass';
import { Environment } from '../../evironments/environment';

@Injectable({
  providedIn: 'root'
})
export class KhilassService {
  private apiUrl =Environment.ApiUrl+ '/khilass';

  constructor(private http: HttpClient) {}

  // ✅ Lister les khilass d’un auteur
  getKhilassByAuteur(auteurId: number): Observable<Khilass[]> {
    return this.http.get<Khilass[]>(`${this.apiUrl}/${auteurId}`);
  }

  // ✅ Détail d’un khilass
  getKhilass(id: number): Observable<Khilass> {
    return this.http.get<Khilass>(`${this.apiUrl}/show/${id}`);
  }

  // ✅ Créer un khilass
  createKhilass(khilassData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, khilassData);
  }

  // ✅ Mettre à jour un khilass
updateKhilass(id: number, khilassData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}?_method=PUT`, khilassData);
}

  // ✅ Supprimer un khilass
  deleteKhilass(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
