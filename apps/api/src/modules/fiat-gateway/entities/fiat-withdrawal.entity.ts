import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('fiat_withdrawals')
export class FiatWithdrawal {
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
  destination_account_id: string;

  @Column({ length: 20, default: 'tKES' })
  source_asset: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  source_amount: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  gross_amount: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  fee_amount: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  net_amount: string;

  @Column({ length: 20, default: 'BANK_TRANSFER' })
  withdrawal_method: string;

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

  @Column({ type: 'int', default: 0 })
  compliance_risk_score: number;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date;
}
