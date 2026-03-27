import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('kyc_records')
export class KycRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  customer_id: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'int' })
  kyc_level: number;

  @Column({ length: 50 })
  verification_method: string;

  @Column({ length: 50, nullable: true })
  id_type: string;

  @Column({ length: 50, nullable: true })
  id_number: string;

  @Column({ length: 20 })
  verification_result: string;

  @Column({ length: 100, nullable: true })
  verifier: string;

  @Column({ type: 'datetime', nullable: true })
  verified_at: Date;

  @Column({ type: 'datetime', nullable: true })
  expires_at: Date;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
