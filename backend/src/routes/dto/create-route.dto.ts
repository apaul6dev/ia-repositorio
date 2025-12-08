import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  vehicle?: string;

  @IsOptional()
  @IsString()
  driver?: string;

  @IsOptional()
  @IsInt()
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
