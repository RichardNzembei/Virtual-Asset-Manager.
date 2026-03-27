import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  symbol: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20 })
  asset_type: string;

  @Column({ length: 20, nullable: true })
  chain: string;

  @Column({ length: 100, nullable: true })
  contract_address: string;

  @Column({ type: 'int', default: 18 })
  decimals: number;

  @Column({ type: 'boolean', default: true })
  is_tradeable: boolean;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;
}
