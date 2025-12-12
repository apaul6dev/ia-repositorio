import { UnauthorizedException, ForbiddenException, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { JwtOptionalGuard } from '../src/auth/jwt-optional.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { Reflector } from '@nestjs/core';

const mockContext = (req: any): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => req,
    }),
    getHandler: () => jest.fn(),
  } as any);

describe('Auth Guards (unit)', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('JwtAuthGuard', () => {
    const jwtService = new JwtService({ secret: 'test-secret' });
    const guard = new JwtAuthGuard(jwtService);

    it('permite acceso con token válido y adjunta user al request', () => {
      const token = jwtService.sign({ sub: 'u1', role: 'client' });
      const req: any = { headers: { authorization: `Bearer ${token}` } };

      const allowed = guard.canActivate(mockContext(req));

      expect(allowed).toBe(true);
      expect(req.user.sub).toBe('u1');
    });

    it('lanza Unauthorized cuando falta token', () => {
      const req: any = { headers: {} };
      expect(() => guard.canActivate(mockContext(req))).toThrow(UnauthorizedException);
    });

    it('lanza Unauthorized con token inválido', () => {
      const req: any = { headers: { authorization: 'Bearer invalid' } };
      expect(() => guard.canActivate(mockContext(req))).toThrow(UnauthorizedException);
    });
  });

  describe('JwtOptionalGuard', () => {
    const jwtService = new JwtService({ secret: 'test-secret' });
    const guard = new JwtOptionalGuard(jwtService);

    it('setea user cuando hay token válido', () => {
      const token = jwtService.sign({ sub: 'u2', role: 'operator' });
      const req: any = { headers: { authorization: `Bearer ${token}` } };

      const allowed = guard.canActivate(mockContext(req));

      expect(allowed).toBe(true);
      expect(req.user.role).toBe('operator');
    });

    it('ignora token inválido pero no bloquea acceso', () => {
      const req: any = { headers: { authorization: 'Bearer bad' } };

      const allowed = guard.canActivate(mockContext(req));

      expect(allowed).toBe(true);
      expect(req.user).toBeUndefined();
    });
  });

  describe('RolesGuard', () => {
    let reflector: jest.Mocked<Reflector>;
    let guard: RolesGuard;

    beforeEach(() => {
      reflector = { get: jest.fn() } as any;
      guard = new RolesGuard(reflector as any);
    });

    it('permite acceso cuando no hay metadatos de roles', () => {
      reflector.get.mockReturnValue(undefined);
      const ctx = mockContext({ user: { role: 'client' } });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('valida que el rol esté permitido', () => {
      reflector.get.mockReturnValue(['admin', 'operator']);
      const ctx = mockContext({ user: { role: 'operator' } });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('lanza Forbidden si el rol no coincide', () => {
      reflector.get.mockReturnValue(['admin']);
      const ctx = mockContext({ user: { role: 'client' } });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
