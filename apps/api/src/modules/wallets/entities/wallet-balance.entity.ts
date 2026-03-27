import {
  Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Wallet } from './wallet.entity';
import { Asset } from './asset.entity';

@Entity('wallet_balances')
@Unique(['wallet_id', 'asset_id'])
export class WalletBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  wallet_id: string;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column('uuid')
  asset_id: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  available: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  pending: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  locked: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  staked: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @UpdateDateColumn()
  last_updated: Date;
}
