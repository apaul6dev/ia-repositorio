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
          Inicia sesión como operador/admin para gestionar estados.
        </span>
      </div>

      <div *ngIf="shipments.length === 0">No hay envíos creados.</div>

      <table *ngIf="shipments.length" style="width:100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th>Tracking</th>
            <th>Estado</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>Operador</th>
          </tr>
        </thead>
        <tbody>
          <tr
            *ngFor="let s of shipments"
            (click)="selectShipment(s)"
            [style.cursor]="'pointer'"
            [style.background]="selected?.id === s.id ? '#eef2ff' : 'transparent'"
          >
            <td>{{ s.trackingCode }}</td>
            <td>{{ s.status }}</td>
            <td>{{ s.originZip }}</td>
            <td>{{ s.destinationZip }}</td>
            <td>{{ s.operator?.email || s.operatorId || 'N/D' }}</td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="selected" class="card" style="margin-top:12px;">
        <h3>Detalle envío</h3>
        <p><strong>Tracking:</strong> {{ selected.trackingCode }}</p>
        <p><strong>Estado:</strong> {{ selected.status }}</p>
        <p><strong>Servicio:</strong> {{ selected.serviceType }} | Peso {{ selected.weightKg }} kg</p>
        <p><strong>Origen/Destino:</strong> {{ selected.originZip }} → {{ selected.destinationZip }}</p>
        <p><strong>Asignado a:</strong> {{ selected.operator?.email || selected.operatorId || 'N/D' }}</p>

        <div *ngIf="auth.user?.role === 'admin'" class="card" style="margin-top:8px;">
          <label>Asignar operador (id)</label>
          <input [(ngModel)]="operatorAssign[selected.id]" placeholder="UUID operador" />
          <button (click)="assignOperator(selected.id)">Asignar</button>
        </div>
        <div *ngIf="auth.user?.role === 'operator'" class="card" style="margin-top:8px;">
          <button (click)="assignMe(selected.id)">Asignarme este envío</button>
        </div>

        <label>Nuevo estado</label>
        <select [(ngModel)]="statusForm.status">
          <option *ngFor="let st of statuses" [value]="st">{{ st }}</option>
        </select>
        <label>Nota</label>
        <input [(ngModel)]="statusForm.note" />
        <label>Ubicación</label>
        <input [(ngModel)]="statusForm.location" />
        <button (click)="updateStatus(selected.id)">Guardar estado</button>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  shipments: any[] = [];
  selected: any = null;
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
    // Operadores ven todos para poder autoasignarse
    const params = {};
    this.api.listOpsShipments(params).subscribe((data) => {
      this.shipments = data || [];
      if (this.shipments.length) {
        const stillSelected = this.shipments.find((s) => s.id === this.selected?.id);
        this.selected = stillSelected || this.shipments[0];
      } else {
        this.selected = null;
      }
    });
  }

  selectShipment(s: any) {
    this.selected = s;
  }

  updateStatus(id: string) {
    this.api.updateStatus(id, this.statusForm).subscribe(() => {
      this.loadShipments();
    });
  }

  assignOperator(id: string) {
    const operatorId = this.operatorAssign[id];
    this.api
      .post(`/ops/shipments/${id}/assign-operator`, { operatorId: operatorId || null })
      .subscribe(() => this.loadShipments());
  }

  assignMe(id: string) {
    this.api
      .post(`/ops/shipments/${id}/assign-operator`, { operatorId: this.auth.user?.id })
      .subscribe(() => this.loadShipments());
  }
}
