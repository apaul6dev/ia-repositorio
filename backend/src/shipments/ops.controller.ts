import { Body, Controller, Get, Param, Post, Query, UseGuards, SetMetadata } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReqUser } from '../auth/user.decorator';
import { UsersService } from '../users/users.service';
import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(JwtAuthGuard)
@Controller('ops/shipments')
export class OpsController {
  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('routeId') routeId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('operatorId') operatorId?: string,
    @Query('meOperator') meOperator?: string,
    @ReqUser() user?: any,
  ) {
    const opId = meOperator === 'true' && user?.sub ? user.sub : operatorId;
    return this.shipmentsService.findAll({
      status: status as any,
      routeId,
      dateFrom,
      dateTo,
      operatorId: opId,
    });
  }

  @Post(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @ReqUser() user: any) {
    return this.usersService.findById(user.sub).then((u) => {
      if (!u) throw new ForbiddenException('User not found');
      return this.shipmentsService.updateStatusAsUser(id, dto, u);
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/assign-operator')
  @SetMetadata('roles', ['admin', 'operator'])
  async assignOperator(
    @Param('id') id: string,
    @Body('operatorId') operatorId: string,
    @ReqUser() user: any,
  ) {
    const actor = await this.usersService.findById(user.sub);
    if (!actor) throw new ForbiddenException('User not found');

    // Admin puede asignar a cualquiera, operador solo a sí mismo
    let targetOperatorId = operatorId;
    if (actor.role === 'operator') {
      targetOperatorId = actor.id;
    } else if (actor.role !== 'admin') {
      throw new ForbiddenException('Only admin or operator can assign');
    }

    if (!targetOperatorId) {
      // unassign
      return this.shipmentsService.assignOperator(id, null);
    }

    return this.shipmentsService.assignOperator(id, targetOperatorId);
  }
}
