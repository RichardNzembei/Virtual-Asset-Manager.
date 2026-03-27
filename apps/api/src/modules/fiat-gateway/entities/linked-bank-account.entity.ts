import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('linked_bank_accounts')
@Unique(['wallet_id', 'bank_code', 'account_number'])
export class LinkedBankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  wallet_id: string;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column('uuid')
  customer_id: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ length: 10, default: 'KCB' })
  bank_code: string;

  @Column({ length: 20 })
  account_number: string;

  @Column({ length: 100, nullable: true })
  account_name: string;

  @Column({ length: 20, default: 'SAVINGS' })
  account_type: string;

  @Column({ length: 3, default: 'KES' })
  currency: string;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
