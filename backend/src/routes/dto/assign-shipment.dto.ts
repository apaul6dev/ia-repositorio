import { IsString } from 'class-validator';

export class AssignShipmentDto {
  @IsString()
  shipmentId!: string;
}
