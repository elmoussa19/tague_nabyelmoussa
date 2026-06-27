import { Component } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { LoaderComponent } from '../../../page/loader/loader.component';
import { RegisterComponent } from "../register/register.component";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, LoaderComponent,],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isButtonLoading: boolean = false; // État de chargement pour le bouton

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.isButtonLoading) return; // Éviter les soumissions multiples

    this.isButtonLoading = true;
    this.errorMessage = ''; // Réinitialiser le message d'erreur

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isButtonLoading = false;
        this.router.navigate(['/home']); // Redirige vers le tableau de bord
      },
      error: (err) => {
        this.isButtonLoading = false;
        this.errorMessage = err.error.message || 'Erreur lors de la connexion';
      }
    });
  }
}
