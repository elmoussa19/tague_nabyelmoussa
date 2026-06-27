import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { KhilassService } from '../service/khilass.service';
import { SingerIdService } from '../../shared/singer-id.service';
import { Khilass } from '../model/khilass';
import { ModalComponent } from '../modal/modal.component';
import { LoaderComponent } from '../loader/loader.component'; // Importez le LoaderComponent
import { Environment } from '../../evironments/environment';

@Component({
  selector: 'app-khilass',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ModalComponent, LoaderComponent],
  templateUrl: './khilass.component.html',
  styleUrls: ['./khilass.component.css']
})
export class KhilassComponent implements OnInit {
  khilassList: Khilass[] = [];
  filteredKhilass: Khilass[] = [];
  searchTerm: string = '';
  showForm: boolean = false;
  selectedKhilass: Khilass | null = null;
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
  private khilassToDelete: number | null = null;

  constructor(
    private khilassService: KhilassService,
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
        this.loadKhilass();
      } else {
        this.showErrorModal('Erreur', 'Aucun ID d\'auteur trouvé dans les paramètres de la route.');
        console.error('No auteurId found in route parameters');
      }
    });
  }

  loadKhilass(): void {
    if (this.auteurId) {
      this.isLoading = true;
      this.khilassService.getKhilassByAuteur(this.auteurId).subscribe({
        next: (khilass) => {
          this.khilassList = khilass.map(k => ({ ...k, duration: 0, currentTime: 0 }));
          this.filteredKhilass = this.khilassList;
          this.khilassList.forEach(khilass => {
            if (khilass.audio) {
              const audio = new Audio(this.getAudioUrl(khilass.audio));
              audio.onloadedmetadata = () => {
                khilass.duration = audio.duration;
                this.khilassList = [...this.khilassList];
                this.filteredKhilass = [...this.filteredKhilass];
              };
              audio.load();
            }
          });
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.showErrorModal('Erreur', 'Erreur lors du chargement des khilass.');
          console.error('Error fetching khilass:', err);
        }
      });
    }
  }

  searchKhilass(): void {
    if (!this.searchTerm) {
      this.filteredKhilass = this.khilassList;
    } else {
      this.filteredKhilass = this.khilassList.filter(khilass =>
        khilass.titre.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  toggleForm(): void {
    this.isButtonLoading['add'] = true; // Activer le loader pour le bouton Ajouter
    setTimeout(() => {
      this.showForm = !this.showForm;
      if (!this.showForm) {
        this.selectedKhilass = null;
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

  editKhilass(id: number): void {
    this.isButtonLoading[`edit_${id}`] = true; // Activer le loader pour le bouton Modifier
    this.khilassService.getKhilass(id).subscribe({
      next: (khilass) => {
        this.selectedKhilass = khilass;
        this.titre = khilass.titre;
        this.currentAudioUrl = khilass.audio ? this.getAudioUrl(khilass.audio) : null;
        this.audioFile = null;
        this.showForm = true;
        this.isButtonLoading[`edit_${id}`] = false; // Désactiver le loader
      },
      error: (err) => {
        this.isButtonLoading[`edit_${id}`] = false; // Désactiver le loader
        this.showErrorModal('Erreur', 'Erreur lors du chargement des données pour modification.');
        console.error('Error fetching khilass for edit:', err);
      }
    });
  }

  saveKhilass(): void {
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

    if (this.selectedKhilass) {
      if (!this.selectedKhilass.id) {
        this.isLoading = false;
        this.showErrorModal('Erreur', 'ID du khilass non défini.');
        console.error('Selected khilass ID is undefined');
        return;
      }
      this.khilassService.updateKhilass(this.selectedKhilass.id, formData).subscribe({
        next: () => {
          this.loadKhilass(); // Recharger la liste complète
          this.toggleForm();
          this.showSuccessModal('Succès', 'Khilass mis à jour avec succès !');
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
          console.error('Error updating khilass:', err);
        }
      });
    } else {
      this.khilassService.createKhilass(formData).subscribe({
        next: () => {
          this.loadKhilass(); // Recharger la liste complète
          this.toggleForm();
          this.showSuccessModal('Succès', 'Khilass créé avec succès !');
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
          console.error('Error creating khilass:', err);
        }
      });
    }
  }

  deleteKhilass(id: number): void {
    this.khilassToDelete = id;
    this.isButtonLoading[`delete_${id}`] = true; // Activer le loader pour le bouton Supprimer
    this.showCustomModal = true;
    this.modalConfig = {
      type: 'confirm',
      title: 'Confirmer la suppression',
      message: 'Voulez-vous vraiment supprimer ce khilass ?',
      icon: 'ri-error-warning-line'
    };
  }

  onModalConfirm(): void {
    if (this.khilassToDelete !== null) {
      this.khilassService.deleteKhilass(this.khilassToDelete).subscribe({
        next: () => {
          this.loadKhilass(); // Recharger la liste complète
          this.showSuccessModal('Succès', 'Khilass supprimé avec succès !');
          this.isButtonLoading[`delete_${this.khilassToDelete}`] = false; // Désactiver le loader
        },
        error: (err) => {
          this.isButtonLoading[`delete_${this.khilassToDelete}`] = false; // Désactiver le loader
          this.showErrorModal('Erreur', 'Erreur lors de la suppression du khilass.');
          console.error('Error deleting khilass:', err);
        }
      });
    }
  }

  onModalCancel(): void {
    if (this.khilassToDelete !== null) {
      this.isButtonLoading[`delete_${this.khilassToDelete}`] = false; // Désactiver le loader si annulation
    }
    this.showCustomModal = false;
    this.khilassToDelete = null;
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

  viewKhilass(id: number): void {
    this.router.navigate(['/khilass', id]);
  }

  getAudioUrl(audioPath: string): string {
    return `${this.apiUrl}/storage/${audioPath}`;
  }

  togglePlay(khilass: Khilass): void {
    if (!khilass.audio) {
      this.showErrorModal('Erreur', 'Aucun fichier audio disponible pour ce khilass.');
      console.error('No audio file for khilass:', khilass);
      return;
    }

    const audioUrl = this.getAudioUrl(khilass.audio);

    if (this.currentlyPlayingId === khilass.id) {
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
      this.currentlyPlayingId = khilass.id;

      this.audio.ontimeupdate = () => {
        khilass.currentTime = this.audio?.currentTime || 0;
        this.khilassList = [...this.khilassList];
        this.filteredKhilass = [...this.filteredKhilass];
      };

      this.audio.onended = () => {
        this.currentlyPlayingId = null;
        this.audio = null;
        khilass.currentTime = 0;
        this.khilassList = [...this.khilassList];
        this.filteredKhilass = [...this.filteredKhilass];
      };
    }
  }

  isPlaying(khilassId: number): boolean {
    return this.currentlyPlayingId === khilassId && this.audio !== null && !this.audio.paused;
  }

  formatDuration(seconds: number): string {
    if (!seconds) return 'Inconnu';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
