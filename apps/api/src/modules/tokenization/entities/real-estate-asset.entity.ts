import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';
import { TokenizedAsset } from './tokenized-asset.entity';

@Entity('real_estate_assets')
export class RealEstateAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tokenized_asset_id: string;

  @OneToOne(() => TokenizedAsset)
  @JoinColumn({ name: 'tokenized_asset_id' })
  tokenized_asset: TokenizedAsset;

  @Column({ length: 50 })
  property_type: string;

  @Column({ length: 200, nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 100, nullable: true })
  county: string;

  @Column({ length: 100, nullable: true })
  title_number: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  land_size_sqm: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  building_size_sqm: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  current_valuation_kes: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  rental_income_monthly_kes: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  occupancy_rate: string;

  @Column({ length: 200, nullable: true })
  spv_name: string;

  @Column({ length: 100, nullable: true })
  spv_registration_number: string;

  @CreateDateColumn()
  created_at: Date;
}
