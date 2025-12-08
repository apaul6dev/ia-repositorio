import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ServiceType } from '../../entities/quote.entity';

export class CreateQuoteDto {
  @IsEnum(['express', 'standard', 'economic'], {
    message: 'serviceType must be express | standard | economic',
  })
  serviceType!: ServiceType;

  @IsNumber()
  @Min(0.1)
  weightKg!: number;

  @IsNumber()
  @Min(0.001)
  volumeM3!: number;

  @IsString()
  originZip!: string;

  @IsString()
  destinationZip!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  shipDate?: string;
}
