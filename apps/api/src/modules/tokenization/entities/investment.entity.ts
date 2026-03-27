import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { TokenizedAsset } from './tokenized-asset.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('investments')
export class Investment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  asset_id: string;

  @ManyToOne(() => TokenizedAsset)
  @JoinColumn({ name: 'asset_id' })
  tokenized_asset: TokenizedAsset;

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

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount_kes: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  token_amount: string;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  token_price: string;

  @Column({ length: 100, nullable: true })
  blockchain_tx_hash: string;

  @Column({ length: 20, default: 'PENDING' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date;
}
