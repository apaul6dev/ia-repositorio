import { NotFoundException } from '@nestjs/common';
import { PaymentsService } from '../src/payments/payments.service';
import { createInMemoryRepo } from './utils/in-memory-repo';
import { Payment } from '../src/entities/payment.entity';
import { Shipment } from '../src/entities/shipment.entity';

describe('PaymentsService (unit)', () => {
  const paymentsRepo = createInMemoryRepo<Payment>();
  const shipmentsRepo = createInMemoryRepo<Shipment>();
  let service: PaymentsService;

  beforeEach(() => {
    paymentsRepo.data.splice(0, paymentsRepo.data.length);
    shipmentsRepo.data.splice(0, shipmentsRepo.data.length);
    service = new PaymentsService(paymentsRepo as any, shipmentsRepo as any);
  });

  it('rechaza iniciar un pago si el envío no existe', async () => {
    await expect(service.init({ shipmentId: 'missing' } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('crea el pago pendiente y expone checkoutUrl', async () => {
    const shipment = await shipmentsRepo.save({
      id: 's-1',
      priceFinal: 99.5,
    } as Shipment);

    const result = await service.init({ shipmentId: shipment.id } as any);

    expect(result.payment.id).toBeDefined();
    expect(result.payment.status).toBe('pending');
    expect(result.payment.amount).toBe(99.5);
    expect(result.payment.externalRef).toBeDefined();
    expect(result.checkoutUrl).toContain(result.payment.externalRef as string);
  });

  it('actualiza el estado a paid cuando el webhook llega con éxito', async () => {
    await paymentsRepo.save({
      id: 'p-1',
      shipmentId: 's-1',
      amount: 10,
      currency: 'USD',
      status: 'pending',
      externalRef: 'EXT-1',
    } as Payment);

    const updated = await service.webhook({ externalRef: 'EXT-1', status: 'paid' } as any);

    expect(updated.status).toBe('paid');
    expect(updated.paidAt).toBeInstanceOf(Date);
  });

  it('lanza error cuando el webhook trae una referencia desconocida', async () => {
    await expect(
      service.webhook({ externalRef: 'nope', status: 'failed' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('recupera pagos existentes o lanza NotFound', async () => {
    const saved = await paymentsRepo.save({
      id: 'p-2',
      shipmentId: 's-2',
      amount: 15,
      currency: 'USD',
      status: 'pending',
    } as Payment);

    const found = await service.findOne(saved.id);
    expect(found.id).toBe(saved.id);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
