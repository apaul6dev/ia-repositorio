import { DataSourceOptions } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { Address } from '../src/entities/address.entity';
import { Quote } from '../src/entities/quote.entity';
import { Shipment } from '../src/entities/shipment.entity';
import { ShipmentStatus } from '../src/entities/shipment-status.entity';
import { Payment } from '../src/entities/payment.entity';
import { Route } from '../src/entities/route.entity';
import { RouteAssignment } from '../src/entities/route-assignment.entity';

export const testDbOptions: DataSourceOptions = {
  type: 'sqlite',
  database: ':memory:',
  dropSchema: true,
  entities: [User, Address, Quote, Shipment, ShipmentStatus, Payment, Route, RouteAssignment],
  synchronize: true,
};
