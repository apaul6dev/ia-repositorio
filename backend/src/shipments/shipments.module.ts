import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { OpsController } from './ops.controller';
import { Shipment } from '../entities/shipment.entity';
import { ShipmentStatus } from '../entities/shipment-status.entity';
import { Quote } from '../entities/quote.entity';
import { Route } from '../entities/route.entity';
import { RouteAssignment } from '../entities/route-assignment.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shipment,
      ShipmentStatus,
      Quote,
      Route,
      RouteAssignment,
    ]),
    NotificationsModule,
    AuthModule,
    UsersModule,
  ],
  providers: [ShipmentsService],
  controllers: [ShipmentsController, OpsController],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
