import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from '../entities/route.entity';
import { RouteAssignment } from '../entities/route-assignment.entity';
import { CreateRouteDto } from './dto/create-route.dto';
import { AssignShipmentDto } from './dto/assign-shipment.dto';
import { ShipmentsService } from '../shipments/shipments.service';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private readonly routesRepo: Repository<Route>,
    @InjectRepository(RouteAssignment)
    private readonly assignmentsRepo: Repository<RouteAssignment>,
    private readonly shipmentsService: ShipmentsService,
  ) {}

  create(dto: CreateRouteDto) {
    const route = this.routesRepo.create(dto);
    return this.routesRepo.save(route);
  }

  findAll() {
    return this.routesRepo.find({ where: {}, order: { createdAt: 'DESC' } });
  }

  async assign(routeId: string, dto: AssignShipmentDto) {
    const route = await this.routesRepo.findOne({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');
    return this.shipmentsService.assignRoute(dto.shipmentId, routeId);
  }

  listAssignments(routeId: string) {
    return this.assignmentsRepo.find({ where: { routeId } });
  }
}
