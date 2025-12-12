import { RoutesController } from '../src/routes/routes.controller';
import { RoutesService } from '../src/routes/routes.service';

describe('RoutesController (unit)', () => {
  let controller: RoutesController;
  let service: jest.Mocked<RoutesService>;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      assign: jest.fn(),
      listAssignments: jest.fn(),
    } as any;
    controller = new RoutesController(service as any);
  });

  it('crea rutas y las lista', async () => {
    const dto = { name: 'Ruta Centro' } as any;
    service.create.mockResolvedValue({ id: 'r1' } as any);
    service.findAll.mockResolvedValue([{ id: 'r1' }] as any);

    const created = await controller.create(dto);
    const list = await controller.findAll();

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(created.id).toBe('r1');
    expect(list[0].id).toBe('r1');
  });

  it('asigna envíos y lista asignaciones', async () => {
    service.assign.mockResolvedValue({ id: 'a1', routeId: 'r1', shipmentId: 's1' } as any);
    service.listAssignments.mockResolvedValue([{ id: 'a1' }] as any);

    const assign = await controller.assign('r1', { shipmentId: 's1' } as any);
    const list = await controller.assignments('r1');

    expect(service.assign).toHaveBeenCalledWith('r1', { shipmentId: 's1' });
    expect(assign.routeId).toBe('r1');
    expect(list.length).toBe(1);
  });
});
