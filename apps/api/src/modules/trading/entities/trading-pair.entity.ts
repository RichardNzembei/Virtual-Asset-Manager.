import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Asset } from '../../wallets/entities/asset.entity';

@Entity('trading_pairs')
export class TradingPair {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  symbol: string;

  @Column('uuid')
  base_asset_id: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'base_asset_id' })
  base_asset: Asset;

  @Column('uuid')
  quote_asset_id: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'quote_asset_id' })
  quote_asset: Asset;

  @Column({ type: 'int', default: 2 })
  price_precision: number;

  @Column({ type: 'int', default: 8 })
  quantity_precision: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0.00000001 })
  min_quantity: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 500 })
  min_notional: string;

  @Column({ type: 'decimal', precision: 8, scale: 4, default: 0.001 })
  maker_fee_rate: string;

  @Column({ type: 'decimal', precision: 8, scale: 4, default: 0.002 })
  taker_fee_rate: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;
}
