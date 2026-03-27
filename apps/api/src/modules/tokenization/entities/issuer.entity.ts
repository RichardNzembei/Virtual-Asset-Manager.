import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('issuers')
export class Issuer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  customer_id: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ length: 200 })
  company_name: string;

  @Column({ length: 100, nullable: true })
  registration_number: string;

  @Column({ length: 20, default: 'PENDING' })
  status: string;

  @Column({ type: 'datetime', nullable: true })
  approved_at: Date;

  @Column('uuid', { nullable: true })
  approved_by: string;

  @CreateDateColumn()
  created_at: Date;
}
