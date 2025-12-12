import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TrackingComponent } from './tracking.component';
import { ApiService } from '../services/api.service';
import { AuthService, SessionUser } from '../services/auth.service';

class AuthStub {
  user: SessionUser | null = null;
}

describe('TrackingComponent', () => {
  let api: jasmine.SpyObj<ApiService>;
  let auth: AuthStub;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['tracking', 'listMyShipments']);
    auth = new AuthStub();
    TestBed.configureTestingModule({
      imports: [TrackingComponent],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: auth },
      ],
    });
  });

  it('carga mis envíos cuando hay sesión', () => {
    auth.user = { id: 'u1', email: 'user@test.com', role: 'client' };
    api.listMyShipments.and.returnValue(of([{ id: 's1', trackingCode: 'PKG-1', status: 'created' }]));

    TestBed.createComponent(TrackingComponent);

    expect(api.listMyShipments).toHaveBeenCalled();
  });

  it('consulta tracking por id o código', () => {
    api.tracking.and.returnValue(of([{ status: 'created' }, { status: 'in_transit' }]));
    const fixture = TestBed.createComponent(TrackingComponent);
    const component = fixture.componentInstance;
    component.shipmentId = 'PKG-1';

    component.load();

    expect(api.tracking).toHaveBeenCalledWith('PKG-1');
    expect(component.events?.length).toBe(2);
  });
});
