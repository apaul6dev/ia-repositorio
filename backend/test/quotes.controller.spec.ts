import { QuotesController } from '../src/quotes/quotes.controller';
import { QuotesService } from '../src/quotes/quotes.service';

describe('QuotesController (unit)', () => {
  let controller: QuotesController;
  let service: jest.Mocked<QuotesService>;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findById: jest.fn(),
    } as any;
    controller = new QuotesController(service as any);
  });

  it('usa el userId del token cuando hay sesión', async () => {
    const dto = { originZip: '1', destinationZip: '2', weightKg: 1, volumeM3: 0.1, serviceType: 'standard' } as any;
    service.create.mockResolvedValue({ id: 'q1' } as any);

    await controller.create(dto, { sub: 'user-1' });

    expect(service.create).toHaveBeenCalledWith({ ...dto, userId: 'user-1' });
  });

  it('respeta un userId explícito en el dto', async () => {
    const dto = { originZip: '1', destinationZip: '2', weightKg: 1, volumeM3: 0.1, serviceType: 'standard', userId: 'from-dto' } as any;

    await controller.create(dto, { sub: 'token-user' });

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('busca una cotización por id', async () => {
    service.findById.mockResolvedValue({ id: 'q1' } as any);

    const res = await controller.findById('q1');

    expect(service.findById).toHaveBeenCalledWith('q1');
    expect(res?.id).toBe('q1');
  });
});
