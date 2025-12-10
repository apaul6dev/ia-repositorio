import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-tracking',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2>Tracking de envío</h2>
      <label>ID o Tracking</label>
      <input [(ngModel)]="shipmentId" placeholder="UUID o código de tracking" />
      <button (click)="load()" [disabled]="loading">Consultar</button>

      <div *ngIf="myShipments.length" class="card" style="margin-top:12px;">
        <h3>Mis envíos</h3>
        <ul>
          <li *ngFor="let s of myShipments">
            <button type="button" (click)="selectMyShipment(s)">
              {{ s.trackingCode }} - {{ s.status }} ({{ s.originZip }} → {{ s.destinationZip }})
            </button>
          </li>
        </ul>
      </div>

      <div *ngIf="events?.length">
        <h3>Línea de tiempo</h3>
        <ul>
          <li *ngFor="let ev of events">
            <strong>{{ ev.status }}</strong> - {{ ev.changedAt | date:'short' }} - {{ ev.location || 'N/D' }}
            <div *ngIf="ev.note">{{ ev.note }}</div>
          </li>
        </ul>
      </div>
    </div>
  `,
})
export class TrackingComponent {
  shipmentId = '';
  events: any[] | null = null;
  loading = false;
  myShipments: any[] = [];

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
  ) {
    this.loadMyShipments();
  }

  load() {
    if (!this.shipmentId) return;
    this.loading = true;
    this.api.tracking(this.shipmentId).subscribe({
      next: (data) => {
        this.events = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('No se encontró tracking');
      },
    });
  }

  loadMyShipments() {
    if (!this.auth.user) return;
    this.api.listMyShipments().subscribe({
      next: (data) => {
        this.myShipments = data || [];
      },
      error: () => {
        this.myShipments = [];
      },
    });
  }

  selectMyShipment(s: any) {
    this.shipmentId = s.id || s.trackingCode;
    this.load();
  }
}
