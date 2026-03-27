import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('aml_alerts')
export class AmlAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  customer_id: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column('uuid', { nullable: true })
  transaction_id: string;

  @Column({ length: 50 })
  alert_type: string;

  @Column({ length: 10 })
  severity: string;

  @Column({ length: 50, nullable: true })
  rule_id: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  details: any;

  @Column({ length: 20, default: 'NEW' })
  status: string;

  @Column('uuid', { nullable: true })
  assigned_to: string;

  @Column('uuid', { nullable: true })
  resolved_by: string;

  @Column({ type: 'text', nullable: true })
  resolution_notes: string;

  @Column({ length: 50, nullable: true })
  str_reference: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  resolved_at: Date;
}
