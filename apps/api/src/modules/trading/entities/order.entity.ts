import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { TradingPair } from './trading-pair.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, nullable: true })
  client_order_id: string;

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
  pair_id: string;

  @ManyToOne(() => TradingPair)
  @JoinColumn({ name: 'pair_id' })
  pair: TradingPair;

  @Column({ length: 10 })
  order_type: string; // LIMIT, MARKET

  @Column({ length: 4 })
  side: string; // BUY, SELL

  @Column({ length: 5, default: 'GTC' })
  time_in_force: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  quantity: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  price: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  filled_quantity: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  remaining_quantity: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  average_fill_price: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  total_cost: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  fee_amount: string;

  @Column({ length: 20, default: 'PENDING' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  filled_at: Date;
}
