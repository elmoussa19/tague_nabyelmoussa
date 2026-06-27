import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chanteur } from '../model/chanteur';
import { HomeService } from '../service/home.service';

@Component({
  selector: 'app-singer-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './singer-form.component.html',
  styleUrls: ['./singer-form.component.css']
})
export class SingerFormComponent {
  @Input() chanteur: Chanteur | null = null;
  @Output() save = new EventEmitter<Chanteur>(); // Emit only Chanteur
  @Output() cancel = new EventEmitter<void>();

  nom: string = '';
  bibliographie: string = '';
  imageFile: File | null = null;
  isEditMode: boolean = false;

  constructor(private homeService: HomeService) {}

  ngOnChanges(): void {
    if (this.chanteur) {
      this.isEditMode = true;
      this.nom = this.chanteur.nom;
      this.bibliographie = this.chanteur.bibliographie || '';
    } else {
      this.isEditMode = false;
      this.resetForm();
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFile = input.files[0];
    }
  }

  onSubmit(): void {
    const formData = new FormData();
    formData.append('nom', this.nom);
    if (this.bibliographie) {
      formData.append('bibliographie', this.bibliographie);
    }
    if (this.imageFile) {
      formData.append('image', this.imageFile);
    }

    if (this.isEditMode && this.chanteur?.id) {
      this.homeService.updateChanteur(this.chanteur.id, formData).subscribe({
        next: (response) => {
          this.save.emit(response.chanteur);
          this.resetForm();
        },
        error: (err) => {
          console.error('Error updating chanteur:', err);
        }
      });
    } else {
      this.homeService.createChanteur(formData).subscribe({
        next: (response) => {
          this.save.emit(response.chanteur);
          this.resetForm();
        },
        error: (err) => {
          console.error('Error creating chanteur:', err);
        }
      });
    }
  }

  onCancel(): void {
    this.resetForm();
    this.cancel.emit();
  }

  private resetForm(): void {
    this.nom = '';
    this.bibliographie = '';
    this.imageFile = null;
  }
}
