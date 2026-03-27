import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('fiat_deposits')
export class FiatDeposit {
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

  @Column('uuid')
  source_account_id: string;

  @Column({ length: 20, default: 'BANK_TRANSFER' })
  deposit_method: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  fee_amount: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  net_amount: string;

  @Column({ length: 20, default: 'tKES' })
  target_asset: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  tokens_amount: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, default: 1 })
  exchange_rate: string;

  @Column({ length: 100, unique: true })
  internal_reference: string;

  @Column({ length: 100, nullable: true })
  idempotency_key: string;

  @Column({ length: 20, default: 'PENDING' })
  status: string;

  @Column({ length: 100, nullable: true })
  t24_transaction_id: string;

  @Column({ length: 100, nullable: true })
  blockchain_tx_hash: string;

  @Column({ length: 20, default: 'PENDING' })
  compliance_status: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date;
}
