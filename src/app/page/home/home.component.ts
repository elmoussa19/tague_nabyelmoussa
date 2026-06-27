import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HomeService } from '../service/home.service';
import { Chanteur } from '../model/chanteur';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { SingerFormComponent } from '../singer-form/singer-form.component';
import { SingerIdService } from '../../shared/singer-id.service';
import { ModalComponent } from '../modal/modal.component';
import { LoaderComponent } from '../loader/loader.component';
import { Environment } from '../../evironments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SingerFormComponent, ModalComponent, LoaderComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  chanteurs: Chanteur[] = [];
  filteredChanteurs: Chanteur[] = [];
  searchTerm: string = '';
  showModal: boolean = false;
  selectedChanteur: Chanteur | null = null;
  showCustomModal: boolean = false;
  isLoading: boolean = false; // Chargement global
  isButtonLoading: { [key: string]: boolean } = {}; // Chargement spécifique par bouton
  modalConfig: {
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    icon: string;
  } = { type: 'confirm', title: '', message: '', icon: '' };
  private apiUrl = Environment.url;
  private chanteurToDelete: number | null = null;

  constructor(
    private homeService: HomeService,
    private router: Router,
    private singerIdService: SingerIdService
  ) {}

  ngOnInit(): void {
    this.loadChanteurs();
  }

  loadChanteurs(): void {
    this.isLoading = true;
    this.homeService.getChanteurs().subscribe({
      next: (chanteurs) => {
        this.chanteurs = chanteurs;
        this.filteredChanteurs = chanteurs;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showErrorModal('Erreur', 'Erreur lors du chargement des chanteurs.');
        console.error('Error fetching chanteurs:', err);
      }
    });
  }

  searchChanteurs(): void {
    this.isLoading = true;
    setTimeout(() => {
      if (!this.searchTerm) {
        this.filteredChanteurs = this.chanteurs;
      } else {
        this.filteredChanteurs = this.chanteurs.filter(chanteur =>
          chanteur.nom.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      }
      this.isLoading = false;
    }, 500);
  }

  goToSingerDashboard(id: number): void {
    this.isLoading = true;
    this.singerIdService.setChanteurId(id.toString());
    setTimeout(() => {
      this.router.navigate([`/dashboard/${id}`]);
      this.isLoading = false;
    }, 500);
  }

  deleteChanteur(id: number): void {
    this.chanteurToDelete = id;
    this.showCustomModal = true;
    this.modalConfig = {
      type: 'confirm',
      title: 'Confirmer la suppression',
      message: 'Voulez-vous vraiment supprimer ce chanteur ?',
      icon: 'ri-error-warning-line'
    };
  }

  onModalConfirm(): void {
    if (this.chanteurToDelete !== null) {
      this.isLoading = true;
      this.homeService.deleteChanteur(this.chanteurToDelete).subscribe({
        next: () => {
          this.loadChanteurs(); // Recharger la liste complète
          this.showSuccessModal('Succès', 'Chanteur supprimé avec succès.');
        },
        error: (err) => {
          this.isLoading = false;
          this.showErrorModal('Erreur', 'Erreur lors de la suppression du chanteur.');
          console.error('Error deleting chanteur:', err);
        }
      });
    }
  }

  editChanteur(id: number): void {
    this.isButtonLoading[`edit_${id}`] = true; // Activer le loader pour le bouton Modifier
    this.homeService.getChanteur(id).subscribe({
      next: (chanteur) => {
        this.selectedChanteur = chanteur;
        this.showModal = true;
        this.isButtonLoading[`edit_${id}`] = false; // Désactiver le loader
      },
      error: (err) => {
        this.isButtonLoading[`edit_${id}`] = false; // Désactiver le loader
        this.showErrorModal('Erreur', 'Erreur lors de la récupération des données du chanteur.');
        console.error('Error fetching chanteur for edit:', err);
      }
    });
  }

  addChanteur(): void {
    this.isButtonLoading['add'] = true; // Activer le loader pour le bouton Ajouter
    setTimeout(() => {
      this.selectedChanteur = null;
      this.showModal = true;
      this.isButtonLoading['add'] = false; // Désactiver le loader
    }, 500);
  }

  handleSave(chanteur: Chanteur): void {
    this.isLoading = true;
    if (this.selectedChanteur) {
      // Modification d'un chanteur
      const chanteurData = new FormData();
      chanteurData.append('nom', chanteur.nom);
      if (chanteur.bibliographie) chanteurData.append('bibliographie', chanteur.bibliographie);
      if (chanteur.image) chanteurData.append('image', chanteur.image);

      this.homeService.updateChanteur(chanteur.id, chanteurData).subscribe({
        next: () => {
          this.loadChanteurs(); // Recharger la liste complète
          this.showSuccessModal('Succès', 'Chanteur modifié avec succès.');
          this.showModal = false;
          this.selectedChanteur = null;
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.showErrorModal('Erreur', 'Erreur lors de la modification du chanteur.');
          console.error('Error updating chanteur:', err);
        }
      });
    } else {
      // Ajout d'un nouveau chanteur
      const chanteurData = new FormData();
      chanteurData.append('nom', chanteur.nom);
      if (chanteur.bibliographie) chanteurData.append('bibliographie', chanteur.bibliographie);
      if (chanteur.image) chanteurData.append('image', chanteur.image);

      this.homeService.createChanteur(chanteurData).subscribe({
        next: () => {
          this.loadChanteurs(); // Recharger la liste complète
          this.showSuccessModal('Succès', 'Chanteur ajouté avec succès.');
          this.showModal = false;
          this.selectedChanteur = null;
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.showErrorModal('Erreur', 'Erreur lors de l\'ajout du chanteur.');
          console.error('Error creating chanteur:', err);
        }
      });
    }
  }

  handleCancel(): void {
    this.showModal = false;
    this.selectedChanteur = null;
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

  onModalCancel(): void {
    this.showCustomModal = false;
    this.chanteurToDelete = null;
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) {
      return 'https://via.placeholder.com/150';
    }
    return `${this.apiUrl}/storage/${imagePath}`;
  }
}
