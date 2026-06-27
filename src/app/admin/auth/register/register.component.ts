import { Component } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { LoaderComponent } from '../../../page/loader/loader.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, LoaderComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  name: string = '';
  email: string = '';
  password: string = '';
  password_confirmation: string = '';
  image: File | null = null;
  errorMessage: string = '';
  isButtonLoading: boolean = false; // État de chargement pour le bouton

  constructor(private authService: AuthService, private router: Router) {}

  onFileChange(event: any) {
    this.image = event.target.files[0];
  }

  onSubmit() {
    if (this.isButtonLoading) return; // Éviter les soumissions multiples

    this.isButtonLoading = true;
    this.errorMessage = ''; // Réinitialiser le message d'erreur

    const formData = new FormData();
    formData.append('name', this.name);
    formData.append('email', this.email);
    formData.append('password', this.password);
    formData.append('password_confirmation', this.password_confirmation);
    if (this.image) {
      formData.append('image', this.image);
    }

    this.authService.register(formData).subscribe({
      next: () => {
        this.isButtonLoading = false;
        this.router.navigate(['/login']); // Redirige vers la connexion après inscription
      },
      error: (err) => {
        this.isButtonLoading = false;
        this.errorMessage = err.error.message || 'Erreur lors de l\'inscription';
      }
    });
  }
}
