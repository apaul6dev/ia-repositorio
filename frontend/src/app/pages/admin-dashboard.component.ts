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
        <div>Asignado a: {{ s.operator?.email || s.operatorId || 'N/D' }}</div>
        <div *ngIf="auth.user?.role === 'admin'" class="card" style="margin-top:8px;">
          <label>Asignar operador (id)</label>
          <input [(ngModel)]="operatorAssign[s.id]" placeholder="UUID operador" />
          <button (click)="assignOperator(s.id)">Asignar</button>
        </div>
        <div *ngIf="auth.user?.role === 'operator'" class="card" style="margin-top:8px;">
          <button (click)="assignMe(s.id)">Asignarme este envío</button>
        </div>
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
  operatorAssign: Record<string, string> = {};

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

  assignOperator(id: string) {
    const operatorId = this.operatorAssign[id];
    if (!operatorId) {
      alert('Ingresa un ID de operador');
      return;
    }
    this.api
      .post(`/ops/shipments/${id}/assign-operator`, { operatorId })
      .subscribe(() => this.loadShipments());
  }

  assignMe(id: string) {
    this.api
      .post(`/ops/shipments/${id}/assign-operator`, { operatorId: this.auth.user?.id })
      .subscribe(() => this.loadShipments());
  }
}
