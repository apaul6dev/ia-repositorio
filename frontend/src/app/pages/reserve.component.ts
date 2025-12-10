import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-reserve',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2>Crear reserva de envío</h2>
      <div class="card" style="margin-bottom: 12px;" *ngIf="!lockUser">
        <h3>Buscar cliente</h3>
        <label>Nombre o email</label>
        <input [(ngModel)]="searchTerm" name="searchTerm" placeholder="Buscar..." />
        <button type="button" (click)="searchUsers()" [disabled]="searching || !searchTerm || searchTerm.length < 2">
          {{ searching ? 'Buscando...' : 'Buscar' }}
        </button>
        <div *ngIf="searchResults.length">
          <p>Selecciona un cliente:</p>
          <select [(ngModel)]="selectedUserId" (change)="selectUserById()">
            <option *ngFor="let u of searchResults" [value]="u.id">
              {{ u.email }} <span *ngIf="u.name">- {{ u.name }}</span>
            </option>
          </select>
        </div>
        <div *ngIf="form.userId">
          Cliente seleccionado: <strong>{{ selectedUserLabel }}</strong>
          <button type="button" (click)="clearUser()">Quitar</button>
        </div>
      </div>
      <form (ngSubmit)="onSubmit()">
        <label>Nombre cliente</label>
        <input
          name="userId"
          [(ngModel)]="form.userId"
          placeholder="Opcional: ID usuario"
          [readonly]="lockUser"
        />

        <label>Cotización ID (opcional)</label>
        <input name="quoteId" [(ngModel)]="form.quoteId" />

        <label>Dirección origen</label>
        <input name="originAddress" [(ngModel)]="form.originAddress" required />

        <label>Dirección destino</label>
        <input name="destinationAddress" [(ngModel)]="form.destinationAddress" required />

        <label>CP origen</label>
        <input name="originZip" [(ngModel)]="form.originZip" required />

        <label>CP destino</label>
        <input name="destinationZip" [(ngModel)]="form.destinationZip" required />

        <label>Peso (kg)</label>
        <input type="number" min="0.1" step="0.1" name="weightKg" [(ngModel)]="form.weightKg" required />

        <label>Volumen (m3)</label>
        <input type="number" min="0.001" step="0.001" name="volumeM3" [(ngModel)]="form.volumeM3" required />

        <label>Servicio</label>
        <select name="serviceType" [(ngModel)]="form.serviceType">
          <option value="express">Express</option>
          <option value="standard">Estándar</option>
          <option value="economic">Económico</option>
        </select>

        <label>Fecha de recogida</label>
        <input type="date" name="pickupDate" [(ngModel)]="form.pickupDate" required />

        <label>Franja horaria</label>
        <input name="pickupSlot" [(ngModel)]="form.pickupSlot" placeholder="9-12 / 14-18" required />

        <label>Precio cotizado</label>
        <input type="number" name="priceQuote" [(ngModel)]="form.priceQuote" required />

        <label>Precio final</label>
        <input type="number" name="priceFinal" [(ngModel)]="form.priceFinal" required />

        <button type="submit" [disabled]="loading">Crear reserva</button>
      </form>

      <div *ngIf="result" class="card" style="margin-top: 12px;">
        <h3>Reserva creada</h3>
        <p>Tracking: {{ result.trackingCode }}</p>
        <p>ID: {{ result.id }}</p>
        <p>Estado: {{ result.status }}</p>
      </div>
    </div>
  `,
})
export class ReserveComponent implements OnInit {
  form: any = {
    userId: '',
    quoteId: '',
    originAddress: '',
    destinationAddress: '',
    originZip: '',
    destinationZip: '',
    weightKg: 1,
    volumeM3: 0.01,
    serviceType: 'standard',
    pickupDate: new Date().toISOString().substring(0, 10),
    pickupSlot: '09:00-12:00',
    priceQuote: 10,
    priceFinal: 10,
  };

  loading = false;
  result: any;
  searchTerm = '';
  searchResults: any[] = [];
  searching = false;
  selectedUserLabel = '';
  selectedUserId = '';
  lockUser = false;

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
  ) {}

  ngOnInit() {
    if (this.auth.user && this.auth.user.role === 'client') {
      this.form.userId = this.auth.user.id;
      this.selectedUserLabel =
        this.auth.user.email + (this.auth.user.name ? ` - ${this.auth.user.name}` : '');
      this.lockUser = true;
    }
  }

  onSubmit() {
    if (!this.form.quoteId) {
      alert('Debes indicar una cotización (quoteId) antes de reservar');
      return;
    }
    this.loading = true;
    this.api.createShipment(this.form).subscribe({
      next: (data) => {
        this.result = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Error al crear reserva');
      },
    });
  }

  searchUsers() {
    if (!this.searchTerm || this.searchTerm.length < 2) return;
    this.searching = true;
    this.api.searchUsers(this.searchTerm).subscribe({
      next: (data) => {
        this.searchResults = data || [];
        this.searching = false;
      },
      error: () => {
        this.searching = false;
        alert('Error al buscar clientes');
      },
    });
  }

  selectUser(user: any) {
    if (this.lockUser) return;
    this.form.userId = user.id;
    this.selectedUserId = user.id;
    this.selectedUserLabel = user.email + (user.name ? ` - ${user.name}` : '');
  }

  selectUserById() {
    const user = this.searchResults.find((u) => u.id === this.selectedUserId);
    if (user) {
      this.selectUser(user);
    }
  }

  clearUser() {
    if (this.lockUser) return;
    this.form.userId = '';
    this.selectedUserId = '';
    this.selectedUserLabel = '';
  }
}
