import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class InitPaymentDto {
  @IsString()
  shipmentId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
