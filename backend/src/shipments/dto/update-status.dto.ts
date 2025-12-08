import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ShipmentStatusCode } from '../../entities/shipment.entity';

export class UpdateStatusDto {
  @IsEnum([
    'created',
    'pickup_scheduled',
    'in_transit',
    'at_hub',
    'out_for_delivery',
    'delivered',
    'incident',
  ])
  status!: ShipmentStatusCode;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  changedBy?: string;
}
