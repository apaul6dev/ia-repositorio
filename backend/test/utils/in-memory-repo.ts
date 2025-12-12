import { randomUUID } from 'crypto';

export type Where<T> = { [K in keyof T]?: any };

export function createInMemoryRepo<T extends { id?: string }>(seed: T[] = []) {
  const data = [...seed];

  const matches = (entity: T, where?: Where<T>) => {
    if (!where) return true;
    return Object.entries(where).every(([key, value]) => (entity as any)[key] === value);
  };

  return {
    data,
    create(payload: Partial<T>) {
      return { ...payload } as T;
    },
    async save(entity: T) {
      if (!entity.id) {
        entity.id = randomUUID();
      }
      const idx = data.findIndex((item) => item.id === entity.id);
      if (idx >= 0) {
        data[idx] = { ...data[idx], ...entity };
      } else {
        data.push(entity);
      }
      return entity;
    },
    async findOne(options: { where?: Where<T> }) {
      const where = options?.where;
      return data.find((item) => matches(item, where)) || null;
    },
    async find(options?: { where?: Where<T> }) {
      const where = options?.where;
      return data.filter((item) => matches(item, where));
    },
    async remove(entity: T) {
      const idx = data.findIndex((item) => item.id === entity.id);
      if (idx >= 0) data.splice(idx, 1);
    },
  };
}
