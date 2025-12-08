import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { Route } from '../entities/route.entity';
import { RouteAssignment } from '../entities/route-assignment.entity';
import { ShipmentsModule } from '../shipments/shipments.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Route, RouteAssignment]),
    forwardRef(() => ShipmentsModule),
    AuthModule,
  ],
  controllers: [RoutesController],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RoutesModule {}
