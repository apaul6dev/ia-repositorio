import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

describe('AuthController (unit)', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(() => {
    service = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
    } as any;
    controller = new AuthController(service as any);
  });

  it('envía el registro al servicio', async () => {
    const dto = { email: 'a@test.com', password: '123456' } as any;
    service.register.mockResolvedValue({ ok: true } as any);

    const res = await controller.register(dto);

    expect(service.register).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ ok: true });
  });

  it('envía login al servicio', async () => {
    const dto = { email: 'a@test.com', password: '123456' } as any;
    service.login.mockResolvedValue({ token: 'abc' } as any);

    const res = await controller.login(dto);

    expect(service.login).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ token: 'abc' });
  });

  it('refresca tokens', async () => {
    const dto = { refreshToken: 'r1' } as any;
    service.refresh.mockResolvedValue({ accessToken: 'a2' } as any);

    const res = await controller.refresh(dto);

    expect(service.refresh).toHaveBeenCalledWith(dto);
    expect(res.accessToken).toBe('a2');
  });
});
