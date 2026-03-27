import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true, nullable: true })
  bank_cif: string;

  @Column({ length: 20, default: 'INDIVIDUAL' })
  customer_type: string;

  @Column({ length: 100 })
  first_name: string;

  @Column({ length: 100 })
  last_name: string;

  @Column({ length: 200, nullable: true })
  email: string;

  @Column({ length: 20, unique: true })
  phone: string;

  @Column({ length: 50, nullable: true })
  national_id: string;

  @Column({ type: 'int', default: 0 })
  kyc_level: number;

  @Column({ length: 20, default: 'PENDING' })
  kyc_status: string;

  @Column({ type: 'int', default: 0 })
  risk_score: number;

  @Column({ length: 20, default: 'LOW' })
  risk_category: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
