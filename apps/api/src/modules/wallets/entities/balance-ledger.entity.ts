import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('balance_ledger')
@Index('idx_ledger_wallet', ['wallet_id', 'created_at'])
export class BalanceLedger {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('uuid')
  wallet_id: string;

  @Column('uuid')
  asset_id: string;

  @Column({ length: 20 })
  entry_type: string; // CREDIT or DEBIT

  @Column({ length: 20 })
  balance_type: string; // available, pending, locked, staked

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  amount: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  balance_before: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  balance_after: string;

  @Column({ length: 50 })
  reference_type: string; // DEPOSIT, WITHDRAWAL, TRADE, MINT, BURN, etc.

  @Column('uuid')
  reference_id: string;

  @Column({ length: 100, nullable: true, unique: true })
  idempotency_key: string;

  @CreateDateColumn()
  created_at: Date;
}
