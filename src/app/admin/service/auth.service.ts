// admin/service/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../model/user';
import { Environment } from '../../evironments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = Environment.ApiUrl; // Remplace par l'URL de ton API Laravel
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Vérifie si un token existe au chargement
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  // Inscription
register(userData: FormData): Observable<any> {
  return this.http.post(`${this.apiUrl}/register`, userData);
}


  // Connexion
  login(credentials: { email: string, password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response.token && response.user) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  // Déconnexion
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
      })
    );
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  // Récupérer l'utilisateur connecté
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Récupérer le token
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
