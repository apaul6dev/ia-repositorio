import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) {
      throw new UnauthorizedException('Email already registered');
    }
    const user = await this.usersService.create(dto);
    return { user: this.sanitize(user), ...this.generateTokens(user.id, user.role) };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const hashed = crypto.createHash('sha256').update(dto.password).digest('hex');
    if (hashed !== user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { user: this.sanitize(user), ...this.generateTokens(user.id, user.role) };
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: process.env.JWT_SECRET || 'dev_secret',
      });
      return this.generateTokens(payload.sub, payload.role);
    } catch (err) {
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
