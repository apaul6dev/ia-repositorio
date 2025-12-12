import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote, ServiceType } from '../entities/quote.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    @InjectRepository(Quote)
    private readonly quotesRepo: Repository<Quote>,
  ) {}

  async create(dto: CreateQuoteDto) {
    const { price, eta } = this.calculate(dto.serviceType, dto.weightKg, dto.volumeM3);
    const quote = this.quotesRepo.create({
      serviceType: dto.serviceType,
      weightKg: dto.weightKg,
      volumeM3: dto.volumeM3,
      originZip: dto.originZip,
      destinationZip: dto.destinationZip,
      userId: dto.userId,
      price,
      etaMinDays: eta.min,
      etaMaxDays: eta.max,
      shipDate: dto.shipDate,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });
    this.logger.log(
      `Quote creada ${quote.serviceType} ${dto.originZip}->${dto.destinationZip} price=${price}`,
    );
    return this.quotesRepo.save(quote);
  }

  async findById(id: string) {
    return this.quotesRepo.findOne({ where: { id } });
  }

  private calculate(
    serviceType: ServiceType,
    weightKg: number,
    volumeM3: number,
  ): { price: number; eta: { min: number; max: number } } {
    const volumetricWeight = volumeM3 * 200; // basic conversion factor
    const billableWeight = Math.max(weightKg, volumetricWeight);
    const baseByService: Record<ServiceType, { base: number; perKg: number; eta: [number, number] }> = {
      express: { base: 8, perKg: 1.8, eta: [1, 2] },
      standard: { base: 5, perKg: 1.2, eta: [2, 4] },
      economic: { base: 3, perKg: 0.9, eta: [3, 6] },
    };

    const cfg = baseByService[serviceType];
    const price = Number((cfg.base + cfg.perKg * billableWeight).toFixed(2));
    return { price, eta: { min: cfg.eta[0], max: cfg.eta[1] } };
  }
}
