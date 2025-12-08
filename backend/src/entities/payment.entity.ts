import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Shipment } from './shipment.entity';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Shipment, { onDelete: 'CASCADE', eager: true })
  shipment!: Shipment;

  @Column()
  shipmentId!: string;

  @Column({ type: 'float' })
  amount!: number;

  @Column({ default: 'USD' })
  currency!: string;

  @Column({ default: 'mockpay' })
  provider!: string;

  @Column({ type: 'varchar', default: 'pending' })
  status!: PaymentStatus;

  @Column({ nullable: true })
  externalRef?: string;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
