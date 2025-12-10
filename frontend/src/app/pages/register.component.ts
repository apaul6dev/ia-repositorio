import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2>Registro</h2>
      <form (ngSubmit)="onSubmit()">
        <label>Nombre</label>
        <input [(ngModel)]="form.name" name="name" required />
        <label>Email</label>
        <input [(ngModel)]="form.email" name="email" type="email" required />
        <label>Teléfono (opcional)</label>
        <input [(ngModel)]="form.phone" name="phone" />
        <label>Contraseña</label>
        <input [(ngModel)]="form.password" name="password" type="password" required />
        <label>Rol</label>
        <select [(ngModel)]="form.role" name="role">
          <option value="client">Cliente</option>
          <option value="operator">Operador</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" [disabled]="loading">Crear cuenta</button>
      </form>
      <p style="margin-top:8px;">¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a></p>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  form: any = {
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'client',
  };
  loading = false;
  private returnUrl = '/';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
    if (this.auth.user) {
      this.router.navigateByUrl(this.returnUrl || '/');
    }
  }

  onSubmit() {
    this.loading = true;
    const payload = {
      ...this.form,
      name: this.form.name?.trim() || undefined,
      phone: this.form.phone?.trim() || undefined,
      email: this.form.email?.trim().toLowerCase(),
      role: this.form.role?.trim().toLowerCase(),
    };
    this.auth.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl(this.returnUrl || '/');
      },
      error: () => {
        this.loading = false;
        alert('Error al registrar. Verifica email y contraseña (min 6).');
      },
    });
  }
}
