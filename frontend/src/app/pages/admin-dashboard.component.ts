import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2>Panel operador</h2>
      <div style="margin-bottom:8px;">
        <button (click)="loadShipments()">Actualizar lista</button>
        <span *ngIf="!auth.user" style="color:#b91c1c; margin-left:8px;">
          Se recomienda iniciar sesión como operador/admin para gestionar estados.
        </span>
      </div>
      <div *ngIf="shipments.length === 0">No hay envíos creados.</div>
      <div class="card" *ngFor="let s of shipments">
        <div><strong>{{ s.trackingCode }}</strong> - {{ s.status }}</div>
        <div>Origen: {{ s.originZip }} → Destino: {{ s.destinationZip }}</div>
        <div>Servicio: {{ s.serviceType }} | Peso: {{ s.weightKg }} kg</div>
        <label>Nuevo estado</label>
        <select [(ngModel)]="statusForm.status">
          <option *ngFor="let st of statuses" [value]="st">{{ st }}</option>
        </select>
        <label>Nota</label>
        <input [(ngModel)]="statusForm.note" />
        <label>Ubicación</label>
        <input [(ngModel)]="statusForm.location" />
        <button (click)="updateStatus(s.id)">Guardar estado</button>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  shipments: any[] = [];
  statuses = [
    'created',
    'pickup_scheduled',
    'in_transit',
    'at_hub',
    'out_for_delivery',
    'delivered',
    'incident',
  ];

  statusForm = {
    status: 'pickup_scheduled',
    note: '',
    location: '',
  };

  constructor(
    private readonly api: ApiService,
    public readonly auth: AuthService,
  ) {}

  ngOnInit() {
    this.loadShipments();
  }

  loadShipments() {
    this.api.listShipments().subscribe((data) => (this.shipments = data));
  }

  updateStatus(id: string) {
    this.api.updateStatus(id, this.statusForm).subscribe(() => {
      this.loadShipments();
    });
  }
}
