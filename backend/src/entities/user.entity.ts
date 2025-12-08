import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { Shipment } from './shipment.entity';
import { Address } from './address.entity';

export type UserRole = 'client' | 'operator' | 'admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'varchar', default: 'client' })
  role!: UserRole;

  @Column({ nullable: true })
  name?: string;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ nullable: true })
  phone?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Shipment, (shipment) => shipment.user)
  shipments!: Shipment[];

  @OneToMany(() => Address, (address) => address.user)
  addresses!: Address[];
}
