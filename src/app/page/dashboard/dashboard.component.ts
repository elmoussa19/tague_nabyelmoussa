import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HomeService } from '../service/home.service';
import { GamouService } from '../service/gamou.service';
import { KhassidaService } from '../service/khassida.service';
import { KhilassService } from '../service/khilass.service';
import { Chanteur } from '../model/chanteur';
import { Gamou } from '../model/gamou';
import { Khassida } from '../model/khassida';
import { Khilass } from '../model/khilass';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { LoaderComponent } from '../loader/loader.component'; // Importez le LoaderComponent
import { ModalComponent } from '../modal/modal.component'; // Importez le ModalComponent
import { EvenementsComponent } from '../evenements/evenements.component';
import { Environment } from '../../evironments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink, LoaderComponent, ModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  chanteur: Chanteur | null = null;
  gamous: Gamou[] = [];
  khassidas: Khassida[] = [];
  khilass: Khilass[] = [];
  recentSongs: Array<Gamou | Khassida | Khilass> = [];
  isLoading: boolean = false; // Chargement global
  isButtonLoading: { [key: string]: boolean } = {}; // Chargement spécifique par bouton
  showCustomModal: boolean = false; // Pour la modale personnalisée
  modalConfig: {
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    icon: string;
  } = { type: 'confirm', title: '', message: '', icon: '' };
  private apiUrl = Environment.url;

  constructor(
    private route: ActivatedRoute,
    private homeService: HomeService,
    private gamouService: GamouService,
    private khassidaService: KhassidaService,
    private khilassService: KhilassService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadChanteur(id);
      this.loadSongs(id);
    } else {
      this.showErrorModal('Erreur', 'Aucun ID de chanteur trouvé dans les paramètres de la route.');
    }
  }

  loadChanteur(id: number): void {
    this.isLoading = true;
    this.homeService.getChanteur(id).subscribe({
      next: (chanteur) => {
        this.chanteur = chanteur;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showErrorModal('Erreur', 'Erreur lors du chargement des détails du chanteur.');
        console.error('Error fetching chanteur:', err);
      }
    });
  }

  loadSongs(auteurId: number): void {
    this.isLoading = true;
    this.gamouService.getGamousByAuteur(auteurId).subscribe({
      next: (gamous) => {
        this.gamous = gamous;
        this.updateRecentSongs();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showErrorModal('Erreur', 'Erreur lors du chargement des gamous.');
        console.error('Error fetching gamous:', err);
      }
    });

    this.khassidaService.getKhassidasByAuteur(auteurId).subscribe({
      next: (khassidas) => {
        this.khassidas = khassidas;
        this.updateRecentSongs();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showErrorModal('Erreur', 'Erreur lors du chargement des khassidas.');
        console.error('Error fetching khassidas:', err);
      }
    });

    this.khilassService.getKhilassByAuteur(auteurId).subscribe({
      next: (khilass) => {
        this.khilass = khilass;
        this.updateRecentSongs();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showErrorModal('Erreur', 'Erreur lors du chargement des khilass.');
        console.error('Error fetching khilass:', err);
      }
    });
  }

  refreshData(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.isButtonLoading['refresh'] = true; // Activer le loader pour le bouton Rafraîchir
      setTimeout(() => {
        this.loadChanteur(id);
        this.loadSongs(id);
        this.isButtonLoading['refresh'] = false; // Désactiver le loader
      }, 500); // Simuler un délai
    }
  }

  updateRecentSongs(): void {
    this.recentSongs = [
      ...this.gamous,
      ...this.khassidas,
      ...this.khilass
    ]
      .filter(song => song.created_at !== undefined && song.created_at !== null)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 5);
  }

  getNewGamousThisMonth(): number {
    const currentMonth = new Date().getMonth();
    return this.gamous.filter(g => g.created_at && new Date(g.created_at).getMonth() === currentMonth).length;
  }

  getNewKhassidasThisMonth(): number {
    const currentMonth = new Date().getMonth();
    return this.khassidas.filter(k => k.created_at && new Date(k.created_at).getMonth() === currentMonth).length;
  }

  getNewKhilassThisMonth(): number {
    const currentMonth = new Date().getMonth();
    return this.khilass.filter(k => k.created_at && new Date(k.created_at).getMonth() === currentMonth).length;
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) {
      return 'https://via.placeholder.com/150';
    }
    return `${this.apiUrl}/storage/${imagePath}`;
  }

  getSongType(song: Gamou | Khassida | Khilass): string {
    if ('auteur_id' in song && this.gamous.some(g => g.id === song.id)) return 'Gamou';
    if ('auteur_id' in song && this.khassidas.some(k => k.id === song.id)) return 'Khassida';
    return 'Khilass';
  }

  getTotalListens(): number {
    return 2400000; // Mock data
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
  }
}
