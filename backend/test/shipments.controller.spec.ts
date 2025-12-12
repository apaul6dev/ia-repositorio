import { UnauthorizedException } from '@nestjs/common';
import { ShipmentsController } from '../src/shipments/shipments.controller';
import { ShipmentsService } from '../src/shipments/shipments.service';

describe('ShipmentsController (unit)', () => {
  let controller: ShipmentsController;
  let service: jest.Mocked<ShipmentsService>;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      tracking: jest.fn(),
    } as any;
    controller = new ShipmentsController(service as any);
  });

  it('crea shipment usando userId del token cuando aplica', async () => {
    const dto = { quoteId: 'q1', originAddress: 'A', destinationAddress: 'B' } as any;
    service.create.mockResolvedValue({ id: 's1' } as any);

    await controller.create(dto, { sub: 'user-1' });

    expect(service.create).toHaveBeenCalledWith({ ...dto, userId: 'user-1' });
  });

  it('filtra con me=true requiriendo token', async () => {
    await controller.findAll(undefined, 'true', undefined, undefined, undefined, undefined, {
      sub: 'u1',
    });

    expect(service.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1' }),
    );
    expect(() =>
      controller.findAll(undefined, 'true', undefined, undefined, undefined, undefined, undefined),
    ).toThrow(UnauthorizedException);
  });

  it('delegates findOne y tracking', async () => {
    service.findOne.mockResolvedValue({ id: 's1' } as any);
    service.tracking.mockResolvedValue([{ status: 'created' }] as any);

    const byId = await controller.findOne('s1');
    const history = await controller.tracking('s1');

    expect(service.findOne).toHaveBeenCalledWith('s1');
    expect(service.tracking).toHaveBeenCalledWith('s1');
    expect(byId?.id).toBe('s1');
    expect(history[0].status).toBe('created');
  });
});
