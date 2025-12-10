import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <header>
      <div class="container">
        <h1>Sistema de Transporte</h1>
        <nav>
          <ng-container *ngIf="auth.user; else guestLinks">
            <a *ngIf="auth.user.role !== 'client'" routerLink="/">Inicio</a>
            <a routerLink="/cotizar">Cotizar</a>
            <a routerLink="/reservar">Reservar</a>
            <a routerLink="/tracking">Tracking</a>
            <a *ngIf="auth.user.role !== 'client'" routerLink="/admin">Operador</a>
            <span style="margin-left:12px;">
              {{ auth.user.email }} ({{ auth.user.role }})
              <button style="margin-left:8px;" (click)="logout()">Salir</button>
            </span>
          </ng-container>
          <ng-template #guestLinks>
            <a routerLink="/login">Login</a>
            <a routerLink="/registro">Registro</a>
          </ng-template>
        </nav>
      </div>
    </header>
    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
})
export class AppComponent {
  constructor(public auth: AuthService) {}

  logout() {
    this.auth.logout();
  }
}
