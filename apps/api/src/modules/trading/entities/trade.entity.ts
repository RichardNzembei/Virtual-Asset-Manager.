import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { TradingPair } from './trading-pair.entity';
import { Order } from './order.entity';

@Entity('trades')
export class Trade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  pair_id: string;

  @ManyToOne(() => TradingPair)
  @JoinColumn({ name: 'pair_id' })
  pair: TradingPair;

  @Column('uuid')
  maker_order_id: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'maker_order_id' })
  maker_order: Order;

  @Column('uuid')
  taker_order_id: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'taker_order_id' })
  taker_order: Order;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  price: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  quantity: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  quote_amount: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  maker_fee: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  taker_fee: string;

  @Column({ length: 4 })
  side: string; // BUY or SELL (taker side)

  @CreateDateColumn()
  executed_at: Date;
}
