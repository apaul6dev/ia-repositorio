import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { QuoteComponent } from './pages/quote.component';
import { ReserveComponent } from './pages/reserve.component';
import { TrackingComponent } from './pages/tracking.component';
import { AdminDashboardComponent } from './pages/admin-dashboard.component';
import { LoginComponent } from './pages/login.component';
import { RegisterComponent } from './pages/register.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'cotizar', component: QuoteComponent, canActivate: [authGuard] },
  { path: 'reservar', component: ReserveComponent, canActivate: [authGuard] },
  { path: 'tracking', component: TrackingComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: '**', redirectTo: 'login' },
];
