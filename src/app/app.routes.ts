// app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './admin/auth/login/login.component';
import { RegisterComponent } from './admin/auth/register/register.component';
import { AuthGuard } from './admin/gard/auth.guard';
import { DashboardComponent } from './page/dashboard/dashboard.component';
import { HomeComponent } from './page/home/home.component';
import { GamouComponent } from './page/gamou/gamou.component';
import { KhassidaComponent } from './page/khassida/khassida.component';
import { KhilassComponent } from './page/khilass/khilass.component';
import { GalerieComponent } from './page/galerie/galerie.component';
import { EvenementsComponent } from './page/evenements/evenements.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard/:id', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'gamou/:id', component: GamouComponent, canActivate: [AuthGuard] },
  { path: 'khassida/:id', component: KhassidaComponent, canActivate: [AuthGuard] },
  { path: 'khilass/:id', component: KhilassComponent, canActivate: [AuthGuard] },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'galerie/:id', component: GalerieComponent, canActivate: [AuthGuard] },
  { path: 'evenements/:id', component: EvenementsComponent, canActivate: [AuthGuard] },

  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home', pathMatch: 'full' } // Redirection pour les routes inconnues
];
