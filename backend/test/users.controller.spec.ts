import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

describe('UsersController (unit)', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findById: jest.fn(),
      listAddresses: jest.fn(),
      addAddress: jest.fn(),
      updateAddress: jest.fn(),
      deleteAddress: jest.fn(),
      searchUsers: jest.fn(),
    } as any;
    controller = new UsersController(service as any);
  });

  it('crea usuarios y devuelve resultado del servicio', async () => {
    service.create.mockResolvedValue({ id: 'u1' } as any);
    const dto = { email: 'a@test.com', password: '123' } as any;

    const res = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res.id).toBe('u1');
  });

  it('me retorna usuario sin passwordHash', async () => {
    service.findById.mockResolvedValue({
      id: 'u1',
      email: 'a@test.com',
      passwordHash: 'secret',
    } as any);

    const me = await controller.me({ sub: 'u1' });

    expect(service.findById).toHaveBeenCalledWith('u1');
    expect((me as any).passwordHash).toBeUndefined();
    expect((me as any).email).toBe('a@test.com');
  });

  it('gestiona direcciones del usuario autenticado', async () => {
    service.listAddresses.mockResolvedValue([{ id: 'addr1' }] as any);
    service.addAddress.mockResolvedValue({ id: 'addr1' } as any);
    service.updateAddress.mockResolvedValue({ id: 'addr1', label: 'HQ' } as any);
    service.deleteAddress.mockResolvedValue(true);

    const list = await controller.myAddresses({ sub: 'u1' });
    const created = await controller.addAddress({ sub: 'u1' }, { label: 'Casa' } as any);
    const updated = await controller.updateAddress(
      { sub: 'u1' },
      'addr1',
      { label: 'HQ' } as any,
    );
    const removed = await controller.deleteAddress({ sub: 'u1' }, 'addr1');

    expect(service.listAddresses).toHaveBeenCalledWith('u1');
    expect(service.addAddress).toHaveBeenCalledWith('u1', { label: 'Casa' });
    expect(service.updateAddress).toHaveBeenCalledWith('u1', 'addr1', { label: 'HQ' });
    expect(service.deleteAddress).toHaveBeenCalledWith('u1', 'addr1');
    expect(list[0].id).toBe('addr1');
    expect(created.id).toBe('addr1');
    expect(updated?.label).toBe('HQ');
    expect(removed).toBe(true);
  });

  it('busca usuarios con filtros', async () => {
    service.searchUsers.mockResolvedValue([{ id: 'u2' }] as any);

    const res = await controller.search('john', 'operator');

    expect(service.searchUsers).toHaveBeenCalledWith('john', 'operator');
    expect(res[0].id).toBe('u2');
  });
});
