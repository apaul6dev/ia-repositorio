import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { makeUser } from './factories/user.factory';

describe('AuthService (unit)', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: JwtService;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      listAddresses: jest.fn(),
      addAddress: jest.fn(),
      updateAddress: jest.fn(),
      deleteAddress: jest.fn(),
      searchUsers: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;
    jwtService = new JwtService({ secret: 'test-secret' });
    service = new AuthService(usersService as UsersService, jwtService);
    process.env.JWT_SECRET = 'test-secret';
  });

  it('registers a new user and returns sanitized payload + tokens', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    const user = makeUser();
    (usersService.create as jest.Mock).mockResolvedValue(user);

    const result = await service.register({ email: user.email, password: 'secret123' } as any);

    expect(usersService.findByEmail).toHaveBeenCalledWith(user.email);
    expect(usersService.create).toHaveBeenCalled();
    expect(result.user.passwordHash).toBeUndefined();
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('throws when registering an existing email', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue({ id: 'u-1' } as any);

    await expect(
      service.register({ email: 'dup@test.com', password: 'secret123' } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logs in with valid credentials', async () => {
    const password = 'strong-pass';
    const user = makeUser({ password, role: 'operator', email: 'valid@test.com' });
    (usersService.findByEmail as jest.Mock).mockResolvedValue(user);

    const result = await service.login({ email: user.email, password } as any);

    expect(usersService.findByEmail).toHaveBeenCalledWith(user.email);
    expect(result.user.passwordHash).toBeUndefined();
    expect(result.accessToken).toMatch(/^[A-Za-z0-9-_]+?/);
  });

  it('rejects login with invalid credentials', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(
      makeUser({ password: 'good-pass', email: 'fail@test.com' }),
    );

    await expect(
      service.login({ email: 'fail@test.com', password: 'bad' } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refreshes a valid refresh token', async () => {
    const refreshToken = jwtService.sign({ sub: 'user-123', role: 'admin' }, { expiresIn: '1h' });

    const result = await service.refresh({ refreshToken } as any);

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('throws on invalid refresh token', async () => {
    await expect(service.refresh({ refreshToken: 'malformed' } as any)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
