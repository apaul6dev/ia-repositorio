import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) {
      this.logger.warn(`Intento de registro duplicado: ${dto.email}`);
      throw new UnauthorizedException('Email already registered');
    }
    const user = await this.usersService.create(dto);
    this.logger.log(`Usuario registrado ${user.email} (${user.role})`);
    return { user: this.sanitize(user), ...this.generateTokens(user.id, user.role) };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      this.logger.warn(`Login fallido (usuario no encontrado): ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    const hashed = crypto.createHash('sha256').update(dto.password).digest('hex');
    if (hashed !== user.passwordHash) {
      this.logger.warn(`Login fallido (password) para ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.log(`Login exitoso ${user.email} (${user.role})`);
    return { user: this.sanitize(user), ...this.generateTokens(user.id, user.role) };
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: process.env.JWT_SECRET || 'dev_secret',
      });
      this.logger.log(`Refresh token válido para usuario ${payload.sub}`);
      return this.generateTokens(payload.sub, payload.role);
    } catch (err) {
      this.logger.warn('Refresh token inválido');
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(userId: string, role: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, role },
      { secret: process.env.JWT_SECRET || 'dev_secret', expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId, role },
      {
        secret: process.env.JWT_SECRET || 'dev_secret',
        expiresIn: '7d',
      },
    );
    return { accessToken, refreshToken };
  }

  private sanitize(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
