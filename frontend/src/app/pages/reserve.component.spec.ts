import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ReserveComponent } from './reserve.component';
import { ApiService } from '../services/api.service';
import { AuthService, SessionUser } from '../services/auth.service';

class AuthStub {
  user: SessionUser | null = null;
}

describe('ReserveComponent', () => {
  let api: jasmine.SpyObj<ApiService>;
  let auth: AuthStub;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['createShipment', 'searchUsers']);
    auth = new AuthStub();
    TestBed.configureTestingModule({
      imports: [ReserveComponent],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: auth },
      ],
    });
  });

  it('bloquea el cambio de usuario cuando hay cliente en sesión', () => {
    auth.user = { id: 'u1', email: 'client@test.com', role: 'client', name: 'Client' };
    const fixture = TestBed.createComponent(ReserveComponent);
    fixture.detectChanges(); // dispara ngOnInit

    const component = fixture.componentInstance;
    expect(component.form.userId).toBe('u1');
    expect(component.lockUser).toBeTrue();
    expect(component.selectedUserLabel).toContain('client@test.com');
  });

  it('requiere una quoteId antes de enviar el formulario', () => {
    const fixture = TestBed.createComponent(ReserveComponent);
    const component = fixture.componentInstance;
    component.form.quoteId = '';
    const alertSpy = spyOn(window, 'alert');

    component.onSubmit();

    expect(alertSpy).toHaveBeenCalledWith('Debes indicar una cotización (quoteId) antes de reservar');
    expect(api.createShipment).not.toHaveBeenCalled();
  });

  it('crea la reserva cuando hay datos válidos', () => {
    api.createShipment.and.returnValue(of({ id: 's1', trackingCode: 'PKG-1', status: 'created' }));
    const fixture = TestBed.createComponent(ReserveComponent);
    const component = fixture.componentInstance;
    component.form.quoteId = 'quote-1';

    component.onSubmit();

    expect(api.createShipment).toHaveBeenCalled();
    expect(component.result?.id).toBe('s1');
    expect(component.loading).toBeFalse();
  });

  it('no ejecuta búsqueda con menos de 2 caracteres', () => {
    const fixture = TestBed.createComponent(ReserveComponent);
    const component = fixture.componentInstance;
    component.searchTerm = 'a';

    component.searchUsers();

    expect(api.searchUsers).not.toHaveBeenCalled();
  });

  it('maneja errores del servicio al crear reservas', () => {
    api.createShipment.and.returnValue(throwError(() => new Error('failure')));
    const fixture = TestBed.createComponent(ReserveComponent);
    const component = fixture.componentInstance;
    component.form.quoteId = 'q1';

    component.onSubmit();

    expect(component.loading).toBeFalse();
  });
});
