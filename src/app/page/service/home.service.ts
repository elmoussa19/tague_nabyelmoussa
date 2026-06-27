import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Chanteur } from '../model/chanteur';
import { Environment } from '../../evironments/environment';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private apiUrl = Environment.ApiUrl;

  constructor(private http: HttpClient) {}

  getChanteurs(): Observable<Chanteur[]> {
    return this.http.get<Chanteur[]>(`${this.apiUrl}/chanteurs`);
  }

  getChanteur(id: number): Observable<Chanteur> {
    return this.http.get<Chanteur>(`${this.apiUrl}/chanteurs/${id}`);
  }

  createChanteur(chanteurData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/chanteurs`, chanteurData);
  }

  updateChanteur(id: number, chanteurData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/chanteurs/${id}?_method=PUT`, chanteurData);
  }

  deleteChanteur(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/chanteurs/${id}`);
  }
}
