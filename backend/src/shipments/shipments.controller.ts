import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { JwtOptionalGuard } from '../auth/jwt-optional.guard';
import { ReqUser } from '../auth/user.decorator';
import { UnauthorizedException } from '@nestjs/common';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @UseGuards(JwtOptionalGuard)
  @Post()
  create(@Body() dto: CreateShipmentDto, @ReqUser() user: any) {
    const payload = user?.sub ? { ...dto, userId: dto.userId || user.sub } : dto;
    return this.shipmentsService.create(payload);
  }

  @UseGuards(JwtOptionalGuard)
  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('me') me?: string,
    @Query('status') status?: string,
    @Query('routeId') routeId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @ReqUser() user?: any,
  ) {
    const ownerId = me === 'true' ? user?.sub : userId;
    if (me === 'true' && !ownerId) {
      throw new UnauthorizedException('Token required for me=true');
    }
    return this.shipmentsService.findAll({
      userId: ownerId,
      status: status as any,
      routeId,
      dateFrom,
      dateTo,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Get(':id/tracking')
  tracking(@Param('id') id: string) {
    return this.shipmentsService.tracking(id);
  }
}
