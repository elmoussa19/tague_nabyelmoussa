import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../admin/service/auth.service';
import { NavbarService } from '../service/navbar.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  private apiUrl = 'http://tague-naby-backend-main-411x3a.laravel.cloud'; // Base URL of your Laravel backend
  isButtonLoading: boolean = false; // État de chargement pour le bouton Déconnexion

  constructor(public authService: AuthService, private navbarService: NavbarService, private router: Router) {}

  logout() {
    if (this.isButtonLoading) return; // Éviter les clics multiples

    this.isButtonLoading = true;
    this.authService.logout().subscribe({
      next: () => {
        this.isButtonLoading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isButtonLoading = false;
        console.error('Logout failed:', err);
      }
    });
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) {
      return ''; // Return empty string if no image
    }
    // Prepend the storage URL to the relative image path
    return `${this.apiUrl}/storage/${imagePath}`;
  }
}
