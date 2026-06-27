import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { GalerieService } from '../service/galerie.service';
import { Galerie } from '../model/galerie';
import { ActivatedRoute } from '@angular/router';
import { ModalComponent } from '../modal/modal.component';
import { LoaderComponent } from '../loader/loader.component'; // Importez le LoaderComponent
import { Environment } from '../../evironments/environment';

@Component({
  selector: 'app-galerie',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ModalComponent, LoaderComponent],
  templateUrl: './galerie.component.html',
  styleUrls: ['./galerie.component.css']
})
export class GalerieComponent implements OnInit {
  galeries: Galerie[] = [];
  filteredGaleries: Galerie[] = [];
  searchTerm: string = '';
  showForm: boolean = false;
  selectedGalerie: Galerie | null = null;
  titre: string = '';
  description: string = '';
  domaine: string = '';
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
  private galerieToDelete: number | null = null;

  constructor(
    private galerieService: GalerieService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.chanteurId = +id;
        this.loadGaleries();
      } else {
        this.showErrorModal('Erreur', 'Aucun ID de chanteur trouvé dans les paramètres de la route.');
        console.error('No chanteurId found in route parameters');
      }
    });
  }

  loadGaleries(): void {
    this.isLoading = true;
    this.galerieService.getGaleries().subscribe({
      next: (galeries) => {
        this.galeries = galeries;
        this.filteredGaleries = galeries;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showErrorModal('Erreur', 'Erreur lors du chargement des galeries.');
        console.error('Error fetching galeries:', err);
      }
    });
  }

  searchGaleries(): void {
    if (!this.searchTerm) {
      this.filteredGaleries = this.galeries;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredGaleries = this.galeries.filter(galerie =>
        (galerie.titre?.toLowerCase().includes(term) ||
         galerie.description?.toLowerCase().includes(term) ||
         galerie.domaine?.toLowerCase().includes(term))
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
    this.selectedGalerie = null;
    this.titre = '';
    this.description = '';
    this.domaine = '';
    this.imageFile = null;
    this.currentImageUrl = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFile = input.files[0];
    }
  }

  saveGalerie(): void {
    if (this.isLoading) {
      this.showErrorModal('Erreur', 'Veuillez attendre que les données soient chargées.');
      return;
    }

    if (!this.titre || (!this.imageFile && !this.selectedGalerie)) {
      this.showErrorModal('Erreur', 'Le titre et l’image sont obligatoires.');
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    formData.append('titre', this.titre);
    if (this.description) formData.append('description', this.description);
    if (this.domaine) formData.append('domaine', this.domaine);
    if (this.imageFile) formData.append('image', this.imageFile);

    if (this.selectedGalerie) {
      this.galerieService.updateGalerie(this.selectedGalerie.id!, formData).subscribe({
        next: () => {
          this.loadGaleries(); // Recharger la liste complète
          this.toggleForm();
          this.showSuccessModal('Succès', 'Galerie mise à jour avec succès !');
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
          console.error('Error updating galerie:', err);
        }
      });
    } else {
      this.galerieService.createGalerie(formData).subscribe({
        next: () => {
          this.loadGaleries(); // Recharger la liste complète
          this.toggleForm();
          this.showSuccessModal('Succès', 'Galerie créée avec succès !');
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
          console.error('Error creating galerie:', err);
        }
      });
    }
  }

  editGalerie(id: number): void {
    this.isButtonLoading[`edit_${id}`] = true; // Activer le loader pour le bouton Modifier
    this.galerieService.getGalerie(id).subscribe({
      next: (galerie) => {
        this.selectedGalerie = galerie;
        this.titre = galerie.titre;
        this.description = galerie.description || '';
        this.domaine = galerie.domaine || '';
        this.currentImageUrl = galerie.image ? this.getImageUrl(galerie.image) : null;
        this.imageFile = null;
        this.showForm = true;
        this.isButtonLoading[`edit_${id}`] = false; // Désactiver le loader
      },
      error: (err) => {
        this.isButtonLoading[`edit_${id}`] = false; // Désactiver le loader
        this.showErrorModal('Erreur', 'Erreur lors du chargement des données pour modification.');
        console.error('Error fetching galerie:', err);
      }
    });
  }

  deleteGalerie(id: number): void {
    this.galerieToDelete = id;
    this.isButtonLoading[`delete_${id}`] = true; // Activer le loader pour le bouton Supprimer
    this.showCustomModal = true;
    this.modalConfig = {
      type: 'confirm',
      title: 'Confirmer la suppression',
      message: 'Voulez-vous vraiment supprimer cette image ?',
      icon: 'ri-error-warning-line'
    };
  }

  onModalConfirm(): void {
    if (this.galerieToDelete !== null) {
      this.galerieService.deleteGalerie(this.galerieToDelete).subscribe({
        next: () => {
          this.loadGaleries(); // Recharger la liste complète
          this.showSuccessModal('Succès', 'Image supprimée avec succès !');
          this.isButtonLoading[`delete_${this.galerieToDelete}`] = false; // Désactiver le loader
        },
        error: (err) => {
          this.isButtonLoading[`delete_${this.galerieToDelete}`] = false; // Désactiver le loader
          this.showErrorModal('Erreur', 'Erreur lors de la suppression de l’image.');
          console.error('Error deleting galerie:', err);
        }
      });
    }
  }

  onModalCancel(): void {
    if (this.galerieToDelete !== null) {
      this.isButtonLoading[`delete_${this.galerieToDelete}`] = false; // Désactiver le loader si annulation
    }
    this.showCustomModal = false;
    this.galerieToDelete = null;
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
}
