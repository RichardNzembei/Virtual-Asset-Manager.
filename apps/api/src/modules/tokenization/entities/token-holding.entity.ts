import {
  Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { TokenizedAsset } from './tokenized-asset.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('token_holdings')
@Unique(['asset_id', 'wallet_id'])
export class TokenHolding {
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

  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  balance: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  locked_balance: string;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  acquisition_price_avg: string;

  @Column({ type: 'date', nullable: true })
  lock_up_until: Date;

  @UpdateDateColumn()
  last_updated: Date;
}
