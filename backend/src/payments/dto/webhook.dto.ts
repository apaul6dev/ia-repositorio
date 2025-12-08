import { IsString } from 'class-validator';

export class PaymentWebhookDto {
  @IsString()
  externalRef!: string;

  @IsString()
  status!: string;
}
