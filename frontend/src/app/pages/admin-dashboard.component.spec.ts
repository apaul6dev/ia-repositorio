import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { ApiService } from '../services/api.service';
import { AuthService, SessionUser } from '../services/auth.service';

class AuthStub {
  user: SessionUser | null = null;
}

describe('AdminDashboardComponent', () => {
  let api: jasmine.SpyObj<ApiService>;
  let auth: AuthStub;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'listOpsShipments',
      'updateStatus',
      'post',
    ]);
    auth = new AuthStub();
    TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: auth },
      ],
    });
  });

  it('carga envíos y selecciona el primero', () => {
    api.listOpsShipments.and.returnValue(
      of([
        { id: 's1', trackingCode: 'PKG-1', status: 'created', originZip: '1', destinationZip: '2' },
        { id: 's2', trackingCode: 'PKG-2', status: 'in_transit', originZip: '3', destinationZip: '4' },
      ]),
    );

    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(api.listOpsShipments).toHaveBeenCalled();
    expect(component.selected?.id).toBe('s1');
  });

  it('envía actualización de estado', () => {
    api.listOpsShipments.and.returnValue(of([{ id: 's1', trackingCode: 'PKG-1' }]));
    api.updateStatus.and.returnValue(of([]));
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.selected = { id: 's1' } as any;
    component.statusForm = { status: 'delivered', note: 'ok', location: 'hub' };

    component.updateStatus('s1');

    expect(api.updateStatus).toHaveBeenCalledWith('s1', component.statusForm);
  });

  it('asigna operadores con rol admin', () => {
    auth.user = { id: 'admin', email: 'a@test.com', role: 'admin' };
    api.listOpsShipments.and.returnValue(of([{ id: 's1', trackingCode: 'PKG-1' }]));
    api.post.and.returnValue(of({}));
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.operatorAssign['s1'] = 'op-1';

    component.assignOperator('s1');

    expect(api.post).toHaveBeenCalledWith('/ops/shipments/s1/assign-operator', {
      operatorId: 'op-1',
    });
  });

  it('permite a operadores autoasignarse', () => {
    auth.user = { id: 'op-1', email: 'op@test.com', role: 'operator' };
    api.listOpsShipments.and.returnValue(of([{ id: 's1', trackingCode: 'PKG-1' }]));
    api.post.and.returnValue(of({}));
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.assignMe('s1');

    expect(api.post).toHaveBeenCalledWith('/ops/shipments/s1/assign-operator', {
      operatorId: 'op-1',
    });
  });
});
