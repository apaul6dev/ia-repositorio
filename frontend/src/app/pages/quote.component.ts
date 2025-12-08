import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  standalone: true,
  selector: 'app-quote',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2>Cotizador de envíos</h2>
      <form (ngSubmit)="onSubmit()">
        <label>Origen (CP)</label>
        <input name="originZip" [(ngModel)]="form.originZip" required />

        <label>Destino (CP)</label>
        <input name="destinationZip" [(ngModel)]="form.destinationZip" required />

        <label>Peso (kg)</label>
        <input name="weightKg" type="number" min="0.1" step="0.1" [(ngModel)]="form.weightKg" required />

        <label>Volumen (m3)</label>
        <input name="volumeM3" type="number" min="0.001" step="0.001" [(ngModel)]="form.volumeM3" required />

        <label>Servicio</label>
        <select name="serviceType" [(ngModel)]="form.serviceType">
          <option value="express">Express</option>
          <option value="standard">Estándar</option>
          <option value="economic">Económico</option>
        </select>

        <button type="submit" [disabled]="loading">Calcular</button>
      </form>

      <div *ngIf="result" class="card" style="margin-top: 12px;">
        <h3>Resultado</h3>
        <p>Precio estimado: <strong>{{ result.price | currency:'USD' }}</strong></p>
        <p>ETA: {{ result.etaMinDays }} - {{ result.etaMaxDays }} días</p>
        <p>ID cotización: {{ result.id }}</p>
      </div>
    </div>
  `,
})
export class QuoteComponent {
  form = {
    originZip: '',
    destinationZip: '',
    weightKg: 1,
    volumeM3: 0.01,
    serviceType: 'standard',
  };

  loading = false;
  result: any;

  constructor(private readonly api: ApiService) {}

  onSubmit() {
    this.loading = true;
    this.api.quote(this.form).subscribe({
      next: (data) => {
        this.result = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Error al cotizar');
      },
    });
  }
}
