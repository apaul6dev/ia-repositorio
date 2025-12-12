import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute } from '@angular/router';

describe('LoginComponent (form validation)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login'], { user: null });
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'returnUrl' ? '/reservar' : null),
              },
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(LoginComponent);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges(); // dispara ngOnInit y setea returnUrl
  });

  it('envía formulario válido y navega al returnUrl', () => {
    auth.login.and.returnValue(of({}));
    const comp = fixture.componentInstance;
    comp.form = { email: 'a@test.com', password: '123456' };

    comp.onSubmit();

    expect(auth.login).toHaveBeenCalledWith(comp.form);
    // verify that we attempted to redirect to the provided returnUrl
    expect(router.navigateByUrl).toHaveBeenCalledWith('/reservar');
  });

  it('maneja error de credenciales dejando loading en false', () => {
    auth.login.and.returnValue(throwError(() => new Error('bad')));
    const comp = fixture.componentInstance;
    comp.form = { email: 'a@test.com', password: 'x' };
    spyOn(window, 'alert');

    comp.onSubmit();

    expect(comp.loading).toBeFalse();
    expect(window.alert).toHaveBeenCalled();
  });
});
