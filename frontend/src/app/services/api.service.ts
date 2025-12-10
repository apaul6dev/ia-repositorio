import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  register(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, payload);
  }

  login(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, payload);
  }

  refresh(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/refresh`, payload);
  }

  searchUsers(term: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/search`, {
      params: { q: term },
    });
  }

  searchOperators(term: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/search`, {
      params: { q: term, role: 'operator' },
    });
  }

  quote(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/quotes`, payload);
  }

  createShipment(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/shipments`, payload);
  }

  listShipments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/shipments`);
  }

  listMyShipments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/shipments`, { params: { me: 'true' } });
  }

  listOpsShipments(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/ops/shipments`, { params });
  }

  tracking(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/shipments/${id}/tracking`);
  }

  updateStatus(id: string, payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/ops/shipments/${id}/status`, payload);
  }

  post(path: string, payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, payload);
  }
}
