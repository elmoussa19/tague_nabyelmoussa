import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../admin/service/auth.service';
import { Chanteur } from '../../page/model/chanteur';
import { SingerIdService } from '../singer-id.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  chanteurId: string = '';
  @Input() chanteur!: Chanteur | null;
  isButtonLoading: boolean = false; // État de chargement pour le bouton Déconnexion

  constructor(
    public authService: AuthService,
    private router: Router,
    private singerIdService: SingerIdService
  ) {}

  ngOnInit(): void {
    // S'abonner au chanteurId$ pour obtenir l'ID du chanteur
    this.singerIdService.chanteurId$.subscribe(id => {
      this.chanteurId = id;
    });
  }

  logout(): void {
    if (this.isButtonLoading) return; // Éviter les clics multiples

    this.isButtonLoading = true;
    // Simuler un léger délai pour le loader
    setTimeout(() => {
      this.isButtonLoading = false;
      this.router.navigate(['/home']); // Rediriger directement vers /home
    }, 500);
  }
}
