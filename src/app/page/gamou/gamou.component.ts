import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { GamouService } from '../service/gamou.service';
import { SingerIdService } from '../../shared/singer-id.service';
import { Gamou } from '../model/gamou';
import { ModalComponent } from '../modal/modal.component';
import { LoaderComponent } from '../loader/loader.component'; // Ajout du LoaderComponent
import { Environment } from '../../evironments/environment';

@Component({
  selector: 'app-gamou',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ModalComponent, LoaderComponent],
  templateUrl: './gamou.component.html',
  styleUrls: ['./gamou.component.css']
})
export class GamouComponent implements OnInit {
  gamouList: Gamou[] = [];
  filteredGamous: Gamou[] = [];
  searchTerm: string = '';
  showForm: boolean = false;
  selectedGamou: Gamou | null = null;
  titre: string = '';
  audioFile: File | null = null;
  currentAudioUrl: string | null = null;
  auteurId: number | null = null;
  isLoading: boolean = false; // Chargement global
  isButtonLoading: { [key: string]: boolean } = {}; // Chargement spécifique par bouton
  currentlyPlayingId: number | null = null;
  private audio: HTMLAudioElement | null = null;
  private apiUrl = Environment.url;
  showCustomModal: boolean = false;
  modalConfig: {
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    icon: string;
  } = { type: 'confirm', title: '', message: '', icon: '' };
  private gamouToDelete: number | null = null;

  constructor(
    private gamouService: GamouService,
    private singerIdService: SingerIdService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.auteurId = +id;
        this.singerIdService.setChanteurId(id);
        this.loadGamous();
      } else {
        this.showErrorModal('Erreur', 'Aucun ID d\'auteur trouvé dans les paramètres de la route.');
        console.error('No auteurId found in route parameters');
      }
    });
  }

  loadGamous(): void {
    if (this.auteurId) {
      this.isLoading = true;
      this.gamouService.getGamousByAuteur(this.auteurId).subscribe({
        next: (gamous) => {
          this.gamouList = gamous.map(g => ({ ...g, duration: 0, currentTime: 0 }));
          this.filteredGamous = this.gamouList;
          this.gamouList.forEach(gamou => {
            if (gamou.audio) {
              const audio = new Audio(this.getAudioUrl(gamou.audio));
              audio.onloadedmetadata = () => {
                gamou.duration = audio.duration;
                this.gamouList = [...this.gamouList];
                this.filteredGamous = [...this.filteredGamous];
              };
              audio.load();
            }
          });
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.showErrorModal('Erreur', 'Erreur lors du chargement des gamous.');
          console.error('Error fetching gamous:', err);
        }
      });
    }
  }

  searchGamous(): void {
    if (!this.searchTerm) {
      this.filteredGamous = this.gamouList;
    } else {
      this.filteredGamous = this.gamouList.filter(gamou =>
        gamou.titre.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  toggleForm(): void {
    this.isButtonLoading['add'] = true; // Activer le loader pour le bouton Ajouter
    setTimeout(() => {
      this.showForm = !this.showForm;
      if (!this.showForm) {
        this.selectedGamou = null;
        this.titre = '';
        this.audioFile = null;
        this.currentAudioUrl = null;
      }
      this.isButtonLoading['add'] = false; // Désactiver le loader
    }, 500);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.audioFile = input.files[0];
    }
  }

  editGamou(id: number): void {
    this.isButtonLoading[`edit_${id}`] = true; // Activer le loader pour le bouton Modifier
    this.gamouService.getGamou(id).subscribe({
      next: (gamou) => {
        this.selectedGamou = gamou;
        this.titre = gamou.titre;
        this.currentAudioUrl = gamou.audio ? this.getAudioUrl(gamou.audio) : null;
        this.audioFile = null;
        this.showForm = true;
        this.isButtonLoading[`edit_${id}`] = false; // Désactiver le loader
      },
      error: (err) => {
        this.isButtonLoading[`edit_${id}`] = false; // Désactiver le loader
        this.showErrorModal('Erreur', 'Erreur lors du chargement des données pour modification.');
        console.error('Error fetching gamou for edit:', err);
      }
    });
  }

  saveGamou(): void {
    if (this.isLoading) {
      this.showErrorModal('Erreur', 'Veuillez attendre que les données soient chargées.');
      return;
    }

    if (!this.auteurId || !this.titre) {
      this.showErrorModal('Erreur', 'Veuillez remplir tous les champs requis.');
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    formData.append('titre', this.titre);
    formData.append('auteur_id', this.auteurId.toString());

    if (this.audioFile) {
      formData.append('audio', this.audioFile);
    }

    if (this.selectedGamou) {
      if (!this.selectedGamou.id) {
        this.isLoading = false;
        this.showErrorModal('Erreur', 'ID du gamou non défini.');
        console.error('Selected gamou ID is undefined');
        return;
      }
      this.gamouService.updateGamou(this.selectedGamou.id, formData).subscribe({
        next: () => {
          this.loadGamous(); // Recharger la liste complète
          this.toggleForm();
          this.showSuccessModal('Succès', 'Gamou mis à jour avec succès !');
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
          console.error('Error updating gamou:', err);
        }
      });
    } else {
      this.gamouService.createGamou(formData).subscribe({
        next: () => {
          this.loadGamous(); // Recharger la liste complète
          this.toggleForm();
          this.showSuccessModal('Succès', 'Gamou créé avec succès !');
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
          console.error('Error creating gamou:', err);
        }
      });
    }
  }

  deleteGamou(id: number): void {
    this.gamouToDelete = id;
    this.isButtonLoading[`delete_${id}`] = true; // Activer le loader pour le bouton Supprimer
    this.showCustomModal = true;
    this.modalConfig = {
      type: 'confirm',
      title: 'Confirmer la suppression',
      message: 'Voulez-vous vraiment supprimer ce gamou ?',
      icon: 'ri-error-warning-line'
    };
  }

  onModalConfirm(): void {
    if (this.gamouToDelete !== null) {
      this.gamouService.deleteGamou(this.gamouToDelete).subscribe({
        next: () => {
          this.loadGamous(); // Recharger la liste complète
          this.showSuccessModal('Succès', 'Gamou supprimé avec succès !');
          this.isButtonLoading[`delete_${this.gamouToDelete}`] = false; // Désactiver le loader
        },
        error: (err) => {
          this.isButtonLoading[`delete_${this.gamouToDelete}`] = false; // Désactiver le loader
          this.showErrorModal('Erreur', 'Erreur lors de la suppression du gamou.');
          console.error('Error deleting gamou:', err);
        }
      });
    }
  }

  onModalCancel(): void {
    if (this.gamouToDelete !== null) {
      this.isButtonLoading[`delete_${this.gamouToDelete}`] = false; // Désactiver le loader si annulation
    }
    this.showCustomModal = false;
    this.gamouToDelete = null;
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

  viewGamou(id: number): void {
    this.router.navigate(['/gamou', id]);
  }

  getAudioUrl(audioPath: string): string {
    return `${this.apiUrl}/storage/${audioPath}`;
  }

  togglePlay(gamou: Gamou): void {
    if (!gamou.audio) {
      this.showErrorModal('Erreur', 'Aucun fichier audio disponible pour ce gamou.');
      console.error('No audio file for gamou:', gamou);
      return;
    }

    const audioUrl = this.getAudioUrl(gamou.audio);

    if (this.currentlyPlayingId === gamou.id) {
      if (this.audio) {
        if (!this.audio.paused) {
          this.audio.pause();
        } else {
          this.audio.play().catch(err => {
            this.showErrorModal('Erreur', 'Erreur lors de la lecture de l\'audio.');
            console.error('Error playing audio:', err);
          });
        }
      }
    } else {
      if (this.audio) {
        this.audio.pause();
        this.audio = null;
      }
      this.audio = new Audio(audioUrl);
      this.audio.play().catch(err => {
        this.showErrorModal('Erreur', 'Erreur lors de la lecture de l\'audio.');
        console.error('Error playing audio:', err);
      });
      this.currentlyPlayingId = gamou.id;

      this.audio.ontimeupdate = () => {
        gamou.currentTime = this.audio?.currentTime || 0;
        this.gamouList = [...this.gamouList];
        this.filteredGamous = [...this.filteredGamous];
      };

      this.audio.onended = () => {
        this.currentlyPlayingId = null;
        this.audio = null;
        gamou.currentTime = 0;
        this.gamouList = [...this.gamouList];
        this.filteredGamous = [...this.filteredGamous];
      };
    }
  }

  isPlaying(gamouId: number): boolean {
    return this.currentlyPlayingId === gamouId && this.audio !== null && !this.audio.paused;
  }

  formatDuration(seconds: number): string {
    if (!seconds) return 'Inconnu';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
