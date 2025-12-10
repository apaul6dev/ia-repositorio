import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export type ServiceType = 'express' | 'standard' | 'economic';

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  serviceType!: ServiceType;

  @Column({ type: 'float' })
  weightKg!: number;

  @Column({ type: 'float' })
  volumeM3!: number;

  @Column()
  originZip!: string;

  @Column()
  destinationZip!: string;

  @Column({ type: 'float' })
  price!: number;

  @Column({ type: 'int' })
  etaMinDays!: number;

  @Column({ type: 'int' })
  etaMaxDays!: number;

  @Column({ type: 'date', nullable: true })
  shipDate?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ nullable: true })
  userId?: string;
}
