import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { QuoteComponent } from './quote.component';
import { ApiService } from '../services/api.service';

describe('QuoteComponent', () => {
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['quote']);
    TestBed.configureTestingModule({
      imports: [QuoteComponent],
      providers: [{ provide: ApiService, useValue: api }],
    });
  });

  it('envía la cotización y muestra el resultado', () => {
    api.quote.and.returnValue(
      of({ id: 'q1', price: 25.5, etaMinDays: 2, etaMaxDays: 4, serviceType: 'standard' }),
    );
    const fixture = TestBed.createComponent(QuoteComponent);
    const component = fixture.componentInstance;

    component.form = {
      originZip: '28001',
      destinationZip: '08001',
      weightKg: 1.2,
      volumeM3: 0.02,
      serviceType: 'express',
    };
    component.onSubmit();

    expect(api.quote).toHaveBeenCalledWith(component.form);
    expect(component.loading).toBeFalse();
    expect(component.result?.id).toBe('q1');
  });

  it('maneja errores dejando el loading en false', () => {
    api.quote.and.returnValue(throwError(() => new Error('failure')));
    const fixture = TestBed.createComponent(QuoteComponent);
    const component = fixture.componentInstance;

    component.onSubmit();
    expect(component.loading).toBeFalse();
  });
});
