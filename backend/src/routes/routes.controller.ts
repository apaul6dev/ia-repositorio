import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { AssignShipmentDto } from './dto/assign-shipment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ops/routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  @Get()
  findAll() {
    return this.routesService.findAll();
  }

  @Post(':routeId/assign')
  assign(
    @Param('routeId') routeId: string,
    @Body() dto: AssignShipmentDto,
  ) {
    return this.routesService.assign(routeId, dto);
  }

  @Get(':routeId/assignments')
  assignments(@Param('routeId') routeId: string) {
    return this.routesService.listAssignments(routeId);
  }
}
