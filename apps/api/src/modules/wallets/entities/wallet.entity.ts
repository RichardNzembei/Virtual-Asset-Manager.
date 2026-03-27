import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  customer_id: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ length: 20, default: 'USER' })
  wallet_type: string;

  @Column({ length: 100, nullable: true })
  wallet_name: string;

  @Column({ length: 20, default: 'PENDING' })
  status: string;

  @Column({ length: 100, nullable: true })
  mpc_key_id: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 1000000 })
  daily_limit_kes: number;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  activated_at: Date;

  @OneToMany(() => WalletAddress, (addr) => addr.wallet)
  addresses: WalletAddress[];
}

import { WalletAddress } from './wallet-address.entity';
