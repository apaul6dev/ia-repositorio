import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { InitPaymentDto } from './dto/init-payment.dto';
import { Shipment } from '../entities/shipment.entity';
import { PaymentWebhookDto } from './dto/webhook.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(Shipment)
    private readonly shipmentsRepo: Repository<Shipment>,
  ) {}

  async init(dto: InitPaymentDto) {
    const shipment = await this.shipmentsRepo.findOne({ where: { id: dto.shipmentId } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    const externalRef = `PAY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const payment = this.paymentsRepo.create({
      shipmentId: dto.shipmentId,
      amount: dto.amount ?? shipment.priceFinal,
      currency: dto.currency || 'USD',
      status: 'pending',
      externalRef,
    });
    const saved = await this.paymentsRepo.save(payment);
    this.logger.log(
      `Pago iniciado para shipment=${dto.shipmentId} amount=${saved.amount} ref=${externalRef}`,
    );
    return {
      payment: saved,
      checkoutUrl: `https://mockpay.local/checkout/${externalRef}`,
    };
  }

  async webhook(dto: PaymentWebhookDto) {
    const payment = await this.paymentsRepo.findOne({
      where: { externalRef: dto.externalRef },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    payment.status = dto.status === 'paid' ? 'paid' : 'failed';
    if (payment.status === 'paid') payment.paidAt = new Date();
    this.logger.log(`Webhook payment ref=${dto.externalRef} status=${payment.status}`);
    return this.paymentsRepo.save(payment);
  }

  async findOne(id: string) {
    const payment = await this.paymentsRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
}
