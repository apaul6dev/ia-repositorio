import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  standalone: true,
  selector: 'app-tracking',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2>Tracking de envío</h2>
      <label>ID de envío</label>
      <input [(ngModel)]="shipmentId" placeholder="UUID de envío" />
      <button (click)="load()" [disabled]="loading">Consultar</button>

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

  constructor(private readonly api: ApiService) {}

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
}
