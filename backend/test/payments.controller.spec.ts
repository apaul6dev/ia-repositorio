import { PaymentsController } from '../src/payments/payments.controller';
import { PaymentsService } from '../src/payments/payments.service';

describe('PaymentsController (unit)', () => {
  let controller: PaymentsController;
  let service: jest.Mocked<PaymentsService>;

  beforeEach(() => {
    service = {
      init: jest.fn(),
      webhook: jest.fn(),
      findOne: jest.fn(),
    } as any;
    controller = new PaymentsController(service as any);
  });

  it('inicia pagos, procesa webhooks y obtiene detalle', async () => {
    service.init.mockResolvedValue({ payment: { id: 'p1' } } as any);
    service.webhook.mockResolvedValue({ status: 'paid' } as any);
    service.findOne.mockResolvedValue({ id: 'p1' } as any);

    const initRes = await controller.init({ shipmentId: 's1' } as any);
    const webhookRes = await controller.webhook({ externalRef: 'ext', status: 'paid' } as any);
    const found = await controller.findOne('p1');

    expect(service.init).toHaveBeenCalledWith({ shipmentId: 's1' });
    expect(initRes.payment.id).toBe('p1');
    expect(webhookRes.status).toBe('paid');
    expect(found.id).toBe('p1');
  });
});
