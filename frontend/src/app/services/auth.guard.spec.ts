import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService, SessionUser } from './auth.service';
import { authGuard } from './auth.guard';

class AuthStub {
  user: SessionUser | null = null;
}

describe('authGuard (standalone)', () => {
  let auth: AuthStub;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    auth = new AuthStub();
    router = jasmine.createSpyObj('Router', ['createUrlTree'], { url: '/' });
    router.createUrlTree.and.returnValue({ redirected: true } as any);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('permite el paso cuando hay usuario en sesión', () => {
    auth.user = { id: 'u1', email: 'test@test.com', role: 'client' };

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/cotizar' } as any),
    );

    expect(result).toBeTrue();
  });

  it('redirecciona a login cuando no hay sesión', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/cotizar' } as any),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/cotizar' },
    });
    expect(result).toEqual({ redirected: true } as any);
  });
});
