import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtOptionalGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;
    if (token) {
      try {
        request.user = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || 'dev_secret',
        });
      } catch (err) {
        // ignore invalid token for optional guard
      }
    }
    return true;
  }
}
