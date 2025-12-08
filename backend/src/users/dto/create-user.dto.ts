import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  phone?: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return undefined;
    const v = value.trim().toLowerCase();
    return v || undefined;
  })
  @IsOptional()
  @IsIn(['client', 'operator', 'admin'])
  role?: 'client' | 'operator' | 'admin';
}
