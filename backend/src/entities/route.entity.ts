import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RouteAssignment } from './route-assignment.entity';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  region?: string;

  @Column({ nullable: true })
  vehicle?: string;

  @Column({ nullable: true })
  driver?: string;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(() => RouteAssignment, (assignment) => assignment.route)
  assignments!: RouteAssignment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
