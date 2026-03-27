import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Wallet } from './wallet.entity';

@Entity('wallet_addresses')
@Unique(['chain', 'address'])
export class WalletAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  wallet_id: string;

  @ManyToOne(() => Wallet, (w) => w.addresses)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column({ length: 20 })
  chain: string;

  @Column({ length: 100 })
  address: string;

  @Column({ length: 100, nullable: true })
  derivation_path: string;

  @Column({ type: 'boolean', default: true })
  is_primary: boolean;

  @CreateDateColumn()
  created_at: Date;
}
