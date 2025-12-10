import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Quote, ServiceType } from './quote.entity';
import { ShipmentStatus } from './shipment-status.entity';
import { RouteAssignment } from './route-assignment.entity';

export type ShipmentStatusCode =
  | 'created'
  | 'pickup_scheduled'
  | 'in_transit'
  | 'at_hub'
  | 'out_for_delivery'
  | 'delivered'
  | 'incident';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  trackingCode!: string;

  @ManyToOne(() => User, (user) => user.shipments, {
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => Quote, { nullable: true, eager: true })
  @JoinColumn({ name: 'quoteId' })
  quote?: Quote;

  @Column({ nullable: true })
  quoteId?: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'operatorId' })
  operator?: User;

  @Column({ nullable: true })
  operatorId?: string;

  @Column({ type: 'varchar' })
  serviceType!: ServiceType;

  @Column({ type: 'float' })
  weightKg!: number;

  @Column({ type: 'float' })
  volumeM3!: number;

  @Column()
  originAddress!: string;

  @Column()
  destinationAddress!: string;

  @Column()
  originZip!: string;

  @Column()
  destinationZip!: string;

  @Column({ type: 'date' })
  pickupDate!: string;

  @Column()
  pickupSlot!: string;

  @Column({ type: 'float' })
  priceQuote!: number;

  @Column({ type: 'float' })
  priceFinal!: number;

  @Column({ type: 'varchar', default: 'created' })
  status!: ShipmentStatusCode;

  @OneToMany(() => ShipmentStatus, (status) => status.shipment, {
    cascade: true,
    eager: true,
  })
  statusHistory!: ShipmentStatus[];

  @OneToMany(() => RouteAssignment, (assignment) => assignment.shipment)
  assignments!: RouteAssignment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
