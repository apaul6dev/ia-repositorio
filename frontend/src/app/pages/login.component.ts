import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2>Iniciar sesión</h2>
      <form (ngSubmit)="onSubmit()">
        <label>Email</label>
        <input [(ngModel)]="form.email" name="email" type="email" required />
        <label>Contraseña</label>
        <input [(ngModel)]="form.password" name="password" type="password" required />
        <button type="submit" [disabled]="loading">Entrar</button>
      </form>
      <p style="margin-top:8px;">¿Sin cuenta? <a routerLink="/registro">Crear cuenta</a></p>
    </div>
  `,
})
export class LoginComponent {
  form = { email: '', password: '' };
  loading = false;

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  onSubmit() {
    this.loading = true;
    this.auth.login(this.form).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.loading = false;
        alert('Credenciales inválidas');
      },
    });
  }
}
