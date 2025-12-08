import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { Quote } from './entities/quote.entity';
import { Shipment } from './entities/shipment.entity';
import { ShipmentStatus } from './entities/shipment-status.entity';
import { Payment } from './entities/payment.entity';
import { Route } from './entities/route.entity';
import { RouteAssignment } from './entities/route-assignment.entity';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
loadEnv({ path: path.resolve(__dirname, '..', envFile) });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'parcels',
  password: process.env.DB_PASS || 'parcels',
  database: process.env.DB_NAME || 'parcels',
  entities: [User, Address, Quote, Shipment, ShipmentStatus, Payment, Route, RouteAssignment],
  migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
});
