import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { EvenementsService } from '../service/evenements.service';
import { Evenement } from '../model/evenements';
import { ActivatedRoute } from '@angular/router';
import { ModalComponent } from '../modal/modal.component';
import { LoaderComponent } from '../loader/loader.component'; // Importez le LoaderComponent
import { Environment } from '../../evironments/environment';

@Component({
  selector: 'app-evenements',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ModalComponent, LoaderComponent],
  templateUrl: './evenements.component.html',
  styleUrls: ['./evenements.component.css']
})
export class EvenementsComponent implements OnInit {
  evenements: Evenement[] = [];
  filteredEvenements: Evenement[] = [];
  searchTerm: string = '';
  showForm: boolean = false;
  selectedEvenement: Evenement | null = null;
  titre: string = '';
  description: string = '';
  date: string = '';
  lieux: string = '';
  imageFile: File | null = null;
  currentImageUrl: string | null = null;
  isLoading: boolean = false; // Chargement global
  isButtonLoading: { [key: string]: boolean } = {}; // Chargement spécifique par bouton
  chanteurId: number | null = null;
  private apiUrl = Environment.url;
  showCustomModal: boolean = false;
  modalConfig: {
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    icon: string;
  } = { type: 'confirm', title: '', message: '', icon: '' };
  private evenementToDelete: number | null = null;

  constructor(
    private evenementsService: EvenementsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.chanteurId = +id;
        this.loadEvenements();
      } else {
        this.showErrorModal('Erreur', 'Aucun ID de chanteur trouvé dans les paramètres de la route.');
        console.error('No chanteurId found in route parameters');
      }
    });
  }

  loadEvenements(): void {
    this.isLoading = true;
    this.evenementsService.getEvenements().subscribe({
      next: (evenements) => {
        this.evenements = evenements;
        this.filteredEvenements = evenements;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showErrorModal('Erreur', 'Erreur lors du chargement des événements.');
        console.error('Error fetching evenements:', err);
      }
    });
  }

  searchEvenements(): void {
    if (!this.searchTerm) {
      this.filteredEvenements = this.evenements;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredEvenements = this.evenements.filter(evenement =>
        (evenement.titre?.toLowerCase().includes(term) ||
         evenement.description?.toLowerCase().includes(term) ||
         evenement.lieux?.toLowerCase().includes(term))
      );
    }
  }

  toggleForm(): void {
    this.isButtonLoading['add'] = true; // Activer le loader pour le bouton Ajouter
    setTimeout(() => {
      this.showForm = !this.showForm;
      if (!this.showForm) {
        this.resetForm();
      }
      this.isButtonLoading['add'] = false; // Désactiver le loader
    }, 500);
  }

  resetForm(): void {
    this.selectedEvenement = null;
    this.titre = '';
    this.description = '';
    this.date = '';
    this.lieux = '';
    this.imageFile = null;
    this.currentImageUrl = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFile = input.files[0];
      this.currentImageUrl = URL.createObjectURL(this.imageFile); // Preview image
    }
  }

  saveEvenement(): void {
    if (this.isLoading) {
      this.showErrorModal('Erreur', 'Veuillez attendre que les données soient chargées.');
      return;
    }

    if (!this.titre || !this.description || !this.date || !this.lieux) {
      this.showErrorModal('Erreur', 'Le titre, la description, la date et le lieu sont obligatoires.');
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    formData.append('titre', this.titre);
    formData.append('description', this.description);
    formData.append('date', this.date);
    formData.append('lieux', this.lieux);
    if (this.imageFile) formData.append('image', this.imageFile);

    if (this.selectedEvenement) {
      this.evenementsService.updateEvenement(this.selectedEvenement.id!, formData).subscribe({
        next: () => {
          this.loadEvenements(); // Recharger la liste complète
          this.toggleForm();
          this.showSuccessModal('Succès', 'Événement mis à jour avec succès.');
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          let errorMessage = 'Erreur lors de la mise à jour : ';
          if (err.error.errors) {
            errorMessage += Object.values(err.error.errors).flat().join(', ');
          } else {
            errorMessage += err.error.message || 'Vérifiez les champs.';
          }
          this.showErrorModal('Erreur', errorMessage);
          console.error('Error updating evenement:', err);
        }
      });
    } else {
      this.evenementsService.createEvenement(formData).subscribe({
        next: () => {
          this.loadEvenements(); // Recharger la liste complète
          this.toggleForm();
          this.showSuccessModal('Succès', 'Événement créé avec succès.');
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          let errorMessage = 'Erreur lors de la création : ';
          if (err.error.errors) {
            errorMessage += Object.values(err.error.errors).flat().join(', ');
          } else {
            errorMessage += err.error.message || 'Vérifiez les champs.';
          }
          this.showErrorModal('Erreur', errorMessage);
          console.error('Error creating evenement:', err);
        }
      });
    }
  }

  editEvenement(id: number): void {
    this.isButtonLoading[`edit_${id}`] = true; // Activer le loader pour le bouton Modifier
    this.evenementsService.getEvenement(id).subscribe({
      next: (evenement) => {
        this.selectedEvenement = evenement;
        this.titre = evenement.titre;
        this.description = evenement.description;
        this.date = new Date(evenement.date).toISOString().split('T')[0]; // Format for input[type=date]
        this.lieux = evenement.lieux;
        this.currentImageUrl = evenement.image ? this.getImageUrl(evenement.image) : null;
        this.imageFile = null;
        this.showForm = true;
        this.isButtonLoading[`edit_${id}`] = false; // Désactiver le loader
      },
      error: (err) => {
        this.isButtonLoading[`edit_${id}`] = false; // Désactiver le loader
        this.showErrorModal('Erreur', 'Erreur lors du chargement des données pour modification.');
        console.error('Error fetching evenement:', err);
      }
    });
  }

  deleteEvenement(id: number): void {
    this.evenementToDelete = id;
    this.isButtonLoading[`delete_${id}`] = true; // Activer le loader pour le bouton Supprimer
    this.showCustomModal = true;
    this.modalConfig = {
      type: 'confirm',
      title: 'Confirmer la suppression',
      message: 'Voulez-vous vraiment supprimer cet événement ?',
      icon: 'ri-error-warning-line'
    };
  }

  onModalConfirm(): void {
    if (this.evenementToDelete !== null) {
      this.evenementsService.deleteEvenement(this.evenementToDelete).subscribe({
        next: () => {
          this.loadEvenements(); // Recharger la liste complète
          this.showSuccessModal('Succès', 'Événement supprimé avec succès !');
          this.isButtonLoading[`delete_${this.evenementToDelete}`] = false; // Désactiver le loader
        },
        error: (err) => {
          this.isButtonLoading[`delete_${this.evenementToDelete}`] = false; // Désactiver le loader
          this.showErrorModal('Erreur', 'Erreur lors de la suppression de l’événement.');
          console.error('Error deleting evenement:', err);
        }
      });
    }
  }

  onModalCancel(): void {
    if (this.evenementToDelete !== null) {
      this.isButtonLoading[`delete_${this.evenementToDelete}`] = false; // Désactiver le loader si annulation
    }
    this.showCustomModal = false;
    this.evenementToDelete = null;
  }

  showSuccessModal(title: string, message: string): void {
    this.showCustomModal = true;
    this.modalConfig = {
      type: 'success',
      title,
      message,
      icon: 'ri-checkbox-circle-line'
    };
  }

  showErrorModal(title: string, message: string): void {
    this.showCustomModal = true;
    this.modalConfig = {
      type: 'error',
      title,
      message,
      icon: 'ri-error-warning-line'
    };
  }

  getImageUrl(imagePath: string): string {
    return `${this.apiUrl}/storage/${imagePath}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
