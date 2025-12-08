import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { QuoteComponent } from './pages/quote.component';
import { ReserveComponent } from './pages/reserve.component';
import { TrackingComponent } from './pages/tracking.component';
import { AdminDashboardComponent } from './pages/admin-dashboard.component';
import { LoginComponent } from './pages/login.component';
import { RegisterComponent } from './pages/register.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'cotizar', component: QuoteComponent },
  { path: 'reservar', component: ReserveComponent },
  { path: 'tracking', component: TrackingComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: '**', redirectTo: '' },
];
