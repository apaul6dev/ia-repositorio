import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Shipment, ShipmentStatusCode } from './shipment.entity';

@Entity('shipment_status_history')
export class ShipmentStatus {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Shipment, (shipment) => shipment.statusHistory, {
    onDelete: 'CASCADE',
  })
  shipment!: Shipment;

  @Column()
  shipmentId!: string;

  @Column({ type: 'varchar' })
  status!: ShipmentStatusCode;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  changedBy?: string;

  @CreateDateColumn()
  changedAt!: Date;
}
