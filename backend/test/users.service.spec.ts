import { UsersService } from '../src/users/users.service';
import { User } from '../src/entities/user.entity';
import { Address } from '../src/entities/address.entity';

type InMemoryRepo<T extends { id?: string }> = ReturnType<typeof makeRepo<T>>;
let addressesRepo: InMemoryRepo<Address>;

function makeRepo<T extends { id?: string }>() {
  const data: T[] = [];
  return {
    data,
    create(payload: Partial<T>) {
      return { ...payload } as T;
    },
    async save(entity: T) {
      if (!entity.id) entity.id = `id-${data.length + 1}` as any;
      const idx = data.findIndex((d) => d.id === entity.id);
      if (idx >= 0) data[idx] = { ...data[idx], ...entity };
      else data.push(entity);
      return entity;
    },
    async findOne(options: { where?: any; relations?: any }) {
      const where = options?.where;
      const found = data.find((item) =>
        where ? Object.entries(where).every(([k, v]) => (item as any)[k] === v) : true,
      );
      if (!found) return null;
      if (options?.relations?.addresses) {
        const addresses = addressesRepo.data.filter(
          (a: Address) => a.userId === (found as any).id,
        );
        return { ...(found as any), addresses };
      }
      return found as any;
    },
    async find(options?: { where?: any }) {
      const where = options?.where;
      return data.filter((item) =>
        where ? Object.entries(where).every(([k, v]) => (item as any)[k] === v) : true,
      );
    },
    async remove(entity: T) {
      const idx = data.findIndex((d) => d.id === entity.id);
      if (idx >= 0) data.splice(idx, 1);
    },
    createQueryBuilder() {
      const state: { term?: string; role?: string } = {};
      const qb = {
        select: () => qb,
        where: (_sql: string, params: any) => {
          state.term = params?.t;
          return qb;
        },
        orderBy: () => qb,
        limit: () => qb,
        andWhere: (_sql: string, params: any) => {
          state.role = params?.role;
          return qb;
        },
        async getMany() {
          const term = (state.term || '').replace(/%/g, '').toLowerCase();
          return data.filter((u: any) => {
            if (state.role && u.role !== state.role) return false;
            if (!term) return true;
            return (
              u.email?.toLowerCase().includes(term) || u.name?.toLowerCase().includes(term)
            );
          });
        },
      };
      return qb as any;
    },
  };
}

describe('UsersService (unit)', () => {
  let usersRepo: InMemoryRepo<User>;
  let service: UsersService;

  beforeEach(() => {
    usersRepo = makeRepo<User>();
    addressesRepo = makeRepo<Address>();
    service = new UsersService(usersRepo as any, addressesRepo as any);
  });

  it('crea usuarios hasheando password y rol por defecto client', async () => {
    const created = await service.create({
      email: 'new@test.com',
      password: 'secret123',
      name: 'New User',
      phone: '555',
    } as any);

    expect(created.id).toBeDefined();
    expect(created.role).toBe('client');
    expect(created.passwordHash).not.toBe('secret123');
    expect(created.passwordHash).toHaveLength(64);
  });

  it('busca por email y por id incluyendo direcciones', async () => {
    const user = await usersRepo.save({
      id: 'u-1',
      email: 'find@test.com',
      name: 'Finder',
      role: 'operator',
      passwordHash: 'hash',
    } as User);
    await addressesRepo.save({
      id: 'addr-1',
      userId: user.id,
      label: 'Casa',
      street: 'Main',
      city: 'City',
      state: 'ST',
      country: 'CO',
      zip: '123',
    } as Address);

    const byEmail = await service.findByEmail(user.email);
    const byId = await service.findById(user.id);

    expect(byEmail?.id).toBe(user.id);
    expect(byId?.addresses?.[0].label).toBe('Casa');
  });

  it('gestiona direcciones: lista, agrega, actualiza y elimina', async () => {
    const user = await usersRepo.save({
      id: 'u-2',
      email: 'addr@test.com',
      passwordHash: 'hash',
    } as User);
    const created = await service.addAddress(user.id, {
      label: 'Oficina',
      street: '1st',
      city: 'Town',
      state: 'ST',
      country: 'CO',
      zip: '999',
    } as any);

    const list = await service.listAddresses(user.id);
    const updated = await service.updateAddress(user.id, created.id, { label: 'HQ' } as any);
    const removed = await service.deleteAddress(user.id, created.id);
    const updateMissing = await service.updateAddress(user.id, 'missing', { label: 'X' } as any);

    expect(list.length).toBe(1);
    expect(updated?.label).toBe('HQ');
    expect(removed).toBe(true);
    expect(updateMissing).toBeNull();
    expect(addressesRepo.data.length).toBe(0);
  });

  it('busca usuarios por término y rol usando query builder', async () => {
    await usersRepo.save({
      id: 'u-3',
      email: 'alice@test.com',
      name: 'Alice',
      role: 'client',
      passwordHash: 'h',
    } as User);
    await usersRepo.save({
      id: 'u-4',
      email: 'bob@test.com',
      name: 'Bob',
      role: 'operator',
      passwordHash: 'h',
    } as User);

    const short = await service.searchUsers('a');
    const clients = await service.searchUsers('alice', 'client');
    const operators = await service.searchUsers('bob', 'client'); // role no coincide

    expect(short).toEqual([]);
    expect(clients[0].email).toBe('alice@test.com');
    expect(operators).toEqual([]);
  });
});
