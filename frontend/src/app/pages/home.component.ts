import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="card">
      <h2>Gestión de envíos y reservas</h2>
      <p>Plataforma académica para cotizar, reservar y hacer seguimiento a paquetes.</p>
      <div class="grid">
        <div class="card">
          <h3>Cotizador</h3>
          <p>Calcula el costo según peso, volumen, origen, destino y servicio.</p>
          <a routerLink="/cotizar">Ir a cotizar</a>
        </div>
        <div class="card">
          <h3>Reserva</h3>
          <p>Programa recogidas con dirección de origen, destino y franja horaria.</p>
          <a routerLink="/reservar">Crear reserva</a>
        </div>
        <div class="card">
          <h3>Tracking</h3>
          <p>Consulta el estado y línea de tiempo de tu envío.</p>
          <a routerLink="/tracking">Ver tracking</a>
        </div>
        <div class="card">
          <h3>Operador</h3>
          <p>Panel simple para actualizar estados y ver reservas.</p>
          <a routerLink="/admin">Panel operador</a>
        </div>
        <div class="card">
          <h3>Acceso</h3>
          <p>Registra clientes, operadores o admins y gestiona tu sesión.</p>
          <a routerLink="/login">Iniciar sesión</a> | <a routerLink="/registro">Registro</a>
        </div>
      </div>
    </div>
  `,
})
export class HomeComponent {}
