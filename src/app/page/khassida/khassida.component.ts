import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { KhassidaService } from '../service/khassida.service';
import { SingerIdService } from '../../shared/singer-id.service';
import { Khassida } from '../model/khassida';
import { ModalComponent } from '../modal/modal.component';
import { LoaderComponent } from '../loader/loader.component'; // Importez le LoaderComponent
import { Environment } from '../../evironments/environment';

@Component({
  selector: 'app-khassida',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ModalComponent, LoaderComponent],
  templateUrl: './khassida.component.html',
  styleUrls: ['./khassida.component.css']
})
export class KhassidaComponent implements OnInit {
  khassidaList: Khassida[] = [];
  filteredKhassidas: Khassida[] = [];
  searchTerm: string = '';
  showForm: boolean = false;
  selectedKhassida: Khassida | null = null;
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
  private khassidaToDelete: number | null = null;

  constructor(
    private khassidaService: KhassidaService,
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
        this.loadKhassidas();
      } else {
        this.showErrorModal('Erreur', 'Aucun ID d\'auteur trouvé dans les paramètres de la route.');
        console.error('No auteurId found in route parameters');
      }
    });
  }

  loadKhassidas(): void {
    if (this.auteurId) {
      this.isLoading = true;
      this.khassidaService.getKhassidasByAuteur(this.auteurId).subscribe({
        next: (khassidas) => {
          this.khassidaList = khassidas.map(k => ({ ...k, duration: 0, currentTime: 0 }));
          this.filteredKhassidas = this.khassidaList;
          this.khassidaList.forEach(khassida => {
            if (khassida.audio) {
              const audio = new Audio(this.getAudioUrl(khassida.audio));
              audio.onloadedmetadata = () => {
                khassida.duration = audio.duration;
                this.khassidaList = [...this.khassidaList];
                this.filteredKhassidas = [...this.filteredKhassidas];
              };
              audio.load();
            }
          });
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.showErrorModal('Erreur', 'Erreur lors du chargement des khassidas.');
          console.error('Error fetching khassidas:', err);
        }
      });
    }
  }

  searchKhassidas(): void {
    if (!this.searchTerm) {
      this.filteredKhassidas = this.khassidaList;
    } else {
      this.filteredKhassidas = this.khassidaList.filter(khassida =>
        khassida.titre.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  toggleForm(): void {
    this.isButtonLoading['add'] = true; // Activer le loader pour le bouton Ajouter
    setTimeout(() => {
      this.showForm = !this.showForm;
      if (!this.showForm) {
        this.selectedKhassida = null;
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

  editKhassida(id: number): void {
    this.isButtonLoading[`edit_${id}`] = true; // Activer le loader pour le bouton Modifier
    this.khassidaService.getKhassida(id).subscribe({
      next: (khassida) => {
        this.selectedKhassida = khassida;
        this.titre = khassida.titre;
        this.currentAudioUrl = khassida.audio ? this.getAudioUrl(khassida.audio) : null;
        this.audioFile = null;
        this.showForm = true;
        this.isButtonLoading[`edit_${id}`] = false; // Désactiver le loader
      },
      error: (err) => {
        this.isButtonLoading[`edit_${id}`] = false; // Désactiver le loader
        this.showErrorModal('Erreur', 'Erreur lors du chargement des données pour modification.');
        console.error('Error fetching khassida for edit:', err);
      }
    });
  }

  saveKhassida(): void {
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

    if (this.selectedKhassida) {
      if (!this.selectedKhassida.id) {
        this.isLoading = false;
        this.showErrorModal('Erreur', 'ID du khassida non défini.');
        console.error('Selected khassida ID is undefined');
        return;
      }
      this.khassidaService.updateKhassida(this.selectedKhassida.id, formData).subscribe({
        next: () => {
          this.loadKhassidas(); // Recharger la liste complète
          this.toggleForm();
          this.showSuccessModal('Succès', 'Khassida mis à jour avec succès !');
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
          console.error('Error updating khassida:', err);
        }
      });
    } else {
      this.khassidaService.createKhassida(formData).subscribe({
        next: () => {
          this.loadKhassidas(); // Recharger la liste complète
          this.toggleForm();
          this.showSuccessModal('Succès', 'Khassida créé avec succès !');
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
          console.error('Error creating khassida:', err);
        }
      });
    }
  }

  deleteKhassida(id: number): void {
    this.khassidaToDelete = id;
    this.isButtonLoading[`delete_${id}`] = true; // Activer le loader pour le bouton Supprimer
    this.showCustomModal = true;
    this.modalConfig = {
      type: 'confirm',
      title: 'Confirmer la suppression',
      message: 'Voulez-vous vraiment supprimer ce khassida ?',
      icon: 'ri-error-warning-line'
    };
  }

  onModalConfirm(): void {
    if (this.khassidaToDelete !== null) {
      this.khassidaService.deleteKhassida(this.khassidaToDelete).subscribe({
        next: () => {
          this.loadKhassidas(); // Recharger la liste complète
          this.showSuccessModal('Succès', 'Khassida supprimé avec succès !');
          this.isButtonLoading[`delete_${this.khassidaToDelete}`] = false; // Désactiver le loader
        },
        error: (err) => {
          this.isButtonLoading[`delete_${this.khassidaToDelete}`] = false; // Désactiver le loader
          this.showErrorModal('Erreur', 'Erreur lors de la suppression du khassida.');
          console.error('Error deleting khassida:', err);
        }
      });
    }
  }

  onModalCancel(): void {
    if (this.khassidaToDelete !== null) {
      this.isButtonLoading[`delete_${this.khassidaToDelete}`] = false; // Désactiver le loader si annulation
    }
    this.showCustomModal = false;
    this.khassidaToDelete = null;
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

  viewKhassida(id: number): void {
    this.router.navigate(['/khassida', id]);
  }

  getAudioUrl(audioPath: string): string {
    return `${this.apiUrl}/storage/${audioPath}`;
  }

  togglePlay(khassida: Khassida): void {
    if (!khassida.audio) {
      this.showErrorModal('Erreur', 'Aucun fichier audio disponible pour ce khassida.');
      console.error('No audio file for khassida:', khassida);
      return;
    }

    const audioUrl = this.getAudioUrl(khassida.audio);

    if (this.currentlyPlayingId === khassida.id) {
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
      this.currentlyPlayingId = khassida.id;

      this.audio.ontimeupdate = () => {
        khassida.currentTime = this.audio?.currentTime || 0;
        this.khassidaList = [...this.khassidaList];
        this.filteredKhassidas = [...this.filteredKhassidas];
      };

      this.audio.onended = () => {
        this.currentlyPlayingId = null;
        this.audio = null;
        khassida.currentTime = 0;
        this.khassidaList = [...this.khassidaList];
        this.filteredKhassidas = [...this.filteredKhassidas];
      };
    }
  }

  isPlaying(khassidaId: number): boolean {
    return this.currentlyPlayingId === khassidaId && this.audio !== null && !this.audio.paused;
  }

  formatDuration(seconds: number): string {
    if (!seconds) return 'Inconnu';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
