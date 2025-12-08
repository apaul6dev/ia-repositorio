import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Route } from './route.entity';
import { Shipment } from './shipment.entity';

@Entity('route_assignments')
export class RouteAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Route, (route) => route.assignments, {
    onDelete: 'CASCADE',
    eager: true,
  })
  route!: Route;

  @Column()
  routeId!: string;

  @ManyToOne(() => Shipment, (shipment) => shipment.assignments, {
    onDelete: 'CASCADE',
    eager: true,
  })
  shipment!: Shipment;

  @Column()
  shipmentId!: string;

  @CreateDateColumn()
  assignedAt!: Date;
}
