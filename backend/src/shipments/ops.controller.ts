import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ops/shipments')
export class OpsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('routeId') routeId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.shipmentsService.findAll({
      status: status as any,
      routeId,
      dateFrom,
      dateTo,
    });
  }

  @Post(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.shipmentsService.addStatus(id, dto);
  }
}
