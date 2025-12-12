import { randomUUID } from 'crypto';
import * as crypto from 'crypto';
import { User } from '../../src/entities/user.entity';

type UserFactoryAttrs = Partial<User> & { password?: string };

export function makeUser(attrs: UserFactoryAttrs = {}) {
  const user = new User();
  user.id = attrs.id ?? randomUUID();
  user.email = attrs.email ?? `user-${user.id}@test.com`;
  user.role = attrs.role ?? 'client';
  user.passwordHash =
    attrs.passwordHash ??
    crypto.createHash('sha256').update(attrs.password || 'secret123').digest('hex');
  user.name = attrs.name ?? 'Test User';
  user.phone = attrs.phone ?? '555-1234';
  const { password, ...rest } = attrs;
  return Object.assign(user, rest);
}
