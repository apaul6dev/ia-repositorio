import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ServiceType } from '../../entities/quote.entity';

export class CreateShipmentDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  quoteId!: string;

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
  originAddress!: string;

  @IsString()
  destinationAddress!: string;

  @IsString()
  originZip!: string;

  @IsString()
  destinationZip!: string;

  @IsString()
  pickupDate!: string;

  @IsString()
  pickupSlot!: string;

  @IsNumber()
  @Min(0)
  priceQuote!: number;

  @IsNumber()
  @Min(0)
  priceFinal!: number;
}
