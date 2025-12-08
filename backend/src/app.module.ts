import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { QuotesModule } from './quotes/quotes.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { Shipment } from './entities/shipment.entity';
import { ShipmentStatus } from './entities/shipment-status.entity';
import { User } from './entities/user.entity';
import { Quote } from './entities/quote.entity';
import { Address } from './entities/address.entity';
import { Payment } from './entities/payment.entity';
import { Route } from './entities/route.entity';
import { RouteAssignment } from './entities/route-assignment.entity';
import { PaymentsModule } from './payments/payments.module';
import { RoutesModule } from './routes/routes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'parcels',
      password: process.env.DB_PASS || 'parcels',
      database: process.env.DB_NAME || 'parcels',
      entities: [
        User,
        Quote,
        Shipment,
        ShipmentStatus,
        Address,
        Payment,
        Route,
        RouteAssignment,
      ],
      synchronize: false,
      migrationsRun: true,
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      logging: false,
    }),
    UsersModule,
    AuthModule,
    QuotesModule,
    ShipmentsModule,
    PaymentsModule,
    RoutesModule,
  ],
})
export class AppModule {}
