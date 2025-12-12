import { OpsController } from '../src/shipments/ops.controller';
import { ShipmentsService } from '../src/shipments/shipments.service';
import { UsersService } from '../src/users/users.service';

describe('OpsController (unit)', () => {
  let controller: OpsController;
  let shipmentsService: jest.Mocked<ShipmentsService>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(() => {
    shipmentsService = {
      findAll: jest.fn(),
      updateStatusAsUser: jest.fn(),
      assignOperator: jest.fn(),
    } as any;
    usersService = {
      findById: jest.fn(),
    } as any;
    controller = new OpsController(shipmentsService as any, usersService as any);
  });

  it('filtra operaciones por operador cuando meOperator=true', async () => {
    await controller.findAll(undefined, undefined, undefined, undefined, undefined, 'true', {
      sub: 'op-1',
    });

    expect(shipmentsService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ operatorId: 'op-1' }),
    );
  });

  it('actualiza estado delegando al servicio con el usuario cargado', async () => {
    usersService.findById.mockResolvedValue({ id: 'op-1', role: 'operator' } as any);
    shipmentsService.updateStatusAsUser.mockResolvedValue([] as any);

    await controller.updateStatus('s1', { status: 'in_transit' } as any, { sub: 'op-1' });

    expect(usersService.findById).toHaveBeenCalledWith('op-1');
    expect(shipmentsService.updateStatusAsUser).toHaveBeenCalledWith(
      's1',
      { status: 'in_transit' },
      expect.objectContaining({ id: 'op-1' }),
    );
  });

  it('permite a admin asignar a cualquier operador', async () => {
    usersService.findById.mockResolvedValue({ id: 'admin', role: 'admin' } as any);
    shipmentsService.assignOperator.mockResolvedValue({} as any);

    await controller.assignOperator('s1', 'op-9', { sub: 'admin' });

    expect(shipmentsService.assignOperator).toHaveBeenCalledWith('s1', 'op-9');
  });

  it('fuerza autoasignación cuando el actor es operador', async () => {
    usersService.findById.mockResolvedValue({ id: 'op-self', role: 'operator' } as any);
    shipmentsService.assignOperator.mockResolvedValue({} as any);

    await controller.assignOperator('s1', 'ignored', { sub: 'op-self' });

    expect(shipmentsService.assignOperator).toHaveBeenCalledWith('s1', 'op-self');
  });
});
