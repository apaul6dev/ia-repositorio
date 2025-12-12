import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService, SessionUser } from './auth.service';

class AuthStub {
  private state: { user: SessionUser | null; accessToken: string | null } = {
    user: null,
    accessToken: null,
  };

  get user() {
    return this.state.user;
  }

  get accessToken() {
    return this.state.accessToken;
  }

  setSession(user: SessionUser, token: string) {
    this.state = { user, accessToken: token };
  }

  logout() {
    this.state = { user: null, accessToken: null };
  }
}

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthStub;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useClass: AuthStub },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService) as any;
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('anexa el token Bearer a las peticiones salientes', () => {
    auth.setSession({ id: 'u1', email: 'test@test.com', role: 'client' }, 'token-123');

    http.get('/api/protected').subscribe();
    const req = httpMock.expectOne('/api/protected');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    req.flush({});
  });

  it('hace logout y redirige ante errores 401/403', () => {
    auth.setSession({ id: 'u1', email: 'test@test.com', role: 'client' }, 'token-123');
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    http.get('/api/protected').subscribe({
      error: (err: HttpErrorResponse) => expect(err.status).toBe(401),
    });
    const req = httpMock.expectOne('/api/protected');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.user).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/' },
    });
  });
});
