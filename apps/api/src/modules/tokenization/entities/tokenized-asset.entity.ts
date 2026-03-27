import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Issuer } from './issuer.entity';

@Entity('tokenized_assets')
export class TokenizedAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  asset_type: string;

  @Column('uuid')
  issuer_id: string;

  @ManyToOne(() => Issuer)
  @JoinColumn({ name: 'issuer_id' })
  issuer: Issuer;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 20, unique: true })
  token_symbol: string;

  @Column({ length: 100 })
  token_name: string;

  @Column({ length: 100, nullable: true })
  token_contract_address: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  total_supply: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  tokens_outstanding: string;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  token_price_kes: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  asset_value_kes: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 100 })
  min_investment_kes: string;

  @Column({ type: 'int', nullable: true })
  max_investors: number;

  @Column({ type: 'int', default: 0 })
  current_investors: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  total_raised_kes: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  expected_yield: string;

  @Column({ length: 20, nullable: true })
  distribution_frequency: string;

  @Column({ type: 'int', nullable: true })
  lock_up_days: number;

  @Column({ type: 'date', nullable: true })
  offering_start: Date;

  @Column({ type: 'date', nullable: true })
  offering_end: Date;

  @Column({ length: 30, default: 'DRAFT' })
  status: string;

  @Column({ length: 30, default: 'PENDING' })
  compliance_status: string;

  @Column({ length: 100, nullable: true })
  cma_reference: string;

  @Column({ type: 'json', nullable: true })
  documents: any;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
