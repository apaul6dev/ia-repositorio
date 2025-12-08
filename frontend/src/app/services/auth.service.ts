import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface SessionUser {
  id: string;
  email: string;
  role: 'client' | 'operator' | 'admin';
  name?: string;
}

export interface SessionState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly state$ = new BehaviorSubject<SessionState>({
    user: null,
    accessToken: null,
    refreshToken: null,
  });

  readonly session$ = this.state$.asObservable();

  constructor(private readonly api: ApiService) {
    const stored = localStorage.getItem('session');
    if (stored) {
      try {
        this.state$.next(JSON.parse(stored));
      } catch {
        this.clear();
      }
    }
  }

  register(payload: any) {
    return this.api.register(payload).pipe(
      tap((res) =>
        this.setSession({
          user: res.user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
        }),
      ),
    );
  }

  login(payload: any) {
    return this.api.login(payload).pipe(
      tap((res) =>
        this.setSession({
          user: res.user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
        }),
      ),
    );
  }

  logout() {
    this.clear();
  }

  get accessToken() {
    return this.state$.value.accessToken;
  }

  get user() {
    return this.state$.value.user;
  }

  private setSession(state: SessionState) {
    this.state$.next(state);
    localStorage.setItem('session', JSON.stringify(state));
  }

  private clear() {
    this.state$.next({ user: null, accessToken: null, refreshToken: null });
    localStorage.removeItem('session');
  }
}
