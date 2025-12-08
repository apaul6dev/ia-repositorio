import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from '../entities/quote.entity';
import { Shipment, ShipmentStatusCode } from '../entities/shipment.entity';
import { ShipmentStatus } from '../entities/shipment-status.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { Route } from '../entities/route.entity';
import { RouteAssignment } from '../entities/route-assignment.entity';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentsRepo: Repository<Shipment>,
    @InjectRepository(ShipmentStatus)
    private readonly statusRepo: Repository<ShipmentStatus>,
    @InjectRepository(Quote)
    private readonly quotesRepo: Repository<Quote>,
    @InjectRepository(Route)
    private readonly routesRepo: Repository<Route>,
    @InjectRepository(RouteAssignment)
    private readonly assignmentsRepo: Repository<RouteAssignment>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateShipmentDto): Promise<Shipment> {
    const quote = dto.quoteId ? await this.quotesRepo.findOne({ where: { id: dto.quoteId } }) : null;

    const shipment = this.shipmentsRepo.create({
      trackingCode: this.generateTrackingCode(),
      user: dto.userId ? ({ id: dto.userId } as any) : undefined,
      quote: quote || (dto.quoteId ? ({ id: dto.quoteId } as any) : undefined),
      serviceType: dto.serviceType,
      weightKg: dto.weightKg,
      volumeM3: dto.volumeM3,
      originAddress: dto.originAddress,
      destinationAddress: dto.destinationAddress,
      originZip: dto.originZip,
      destinationZip: dto.destinationZip,
      pickupDate: dto.pickupDate,
      pickupSlot: dto.pickupSlot,
      priceQuote: dto.priceQuote,
      priceFinal: dto.priceFinal,
      status: 'created',
    });

    const saved = await this.shipmentsRepo.save(shipment);
    await this.addStatus(saved.id, {
      status: 'created',
      note: 'Reserva creada',
      changedBy: 'system',
    });
    return this.findOne(saved.id);
  }

  async findAll(filters?: {
    userId?: string;
    status?: ShipmentStatusCode;
    routeId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const qb = this.shipmentsRepo
      .createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.user', 'user')
      .leftJoinAndSelect('shipment.quote', 'quote')
      .leftJoinAndSelect('shipment.statusHistory', 'statusHistory')
      .orderBy('shipment.createdAt', 'DESC');

    if (filters?.status) qb.andWhere('shipment.status = :status', { status: filters.status });
    if (filters?.userId) qb.andWhere('shipment.userId = :userId', { userId: filters.userId });
    if (filters?.dateFrom && filters?.dateTo) {
      qb.andWhere('shipment.createdAt BETWEEN :from AND :to', {
        from: filters.dateFrom,
        to: filters.dateTo,
      });
    }
    if (filters?.routeId) {
      qb.leftJoin('shipment.assignments', 'assignments');
      qb.andWhere('assignments.routeId = :routeId', { routeId: filters.routeId });
    }
    return qb.getMany();
  }

  async findOne(id: string) {
    const shipment = await this.shipmentsRepo.findOne({ where: { id } });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    return shipment;
  }

  async tracking(id: string) {
    const shipment = await this.shipmentsRepo.findOne({
      where: { id },
      relations: ['statusHistory'],
      order: { statusHistory: { changedAt: 'ASC' } },
    });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    return shipment.statusHistory;
  }

  async addStatus(id: string, dto: UpdateStatusDto) {
    const shipment = await this.shipmentsRepo.findOne({ where: { id } });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    shipment.status = dto.status as ShipmentStatusCode;
    await this.shipmentsRepo.save(shipment);

    const statusEntry = this.statusRepo.create({
      shipmentId: shipment.id,
      status: dto.status,
      note: dto.note,
      location: dto.location,
      changedBy: dto.changedBy,
    });
    await this.statusRepo.save(statusEntry);
    this.notificationsService.notifyShipmentStatus(
      shipment.id,
      dto.status,
      shipment.user?.email || 'client',
    );
    return this.tracking(id);
  }

  async assignRoute(shipmentId: string, routeId: string) {
    const shipment = await this.shipmentsRepo.findOne({ where: { id: shipmentId } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    const route = await this.routesRepo.findOne({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');
    const assignment = this.assignmentsRepo.create({
      shipmentId,
      routeId,
    });
    return this.assignmentsRepo.save(assignment);
  }

  async listAssignments(routeId: string) {
    return this.assignmentsRepo.find({ where: { routeId } });
  }

  private generateTrackingCode(): string {
    const prefix = 'PKG';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}-${random}`;
  }
}
