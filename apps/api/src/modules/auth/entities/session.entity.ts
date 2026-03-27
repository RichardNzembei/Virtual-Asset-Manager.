import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  customer_id: string;

  @Column('uuid', { nullable: true })
  admin_user_id: string;

  @Column({ length: 20 })
  user_type: string; // CUSTOMER or ADMIN

  @Column({ length: 100, nullable: true })
  device_id: string;

  @Column({ length: 50, nullable: true })
  ip_address: string;

  @Column({ length: 255 })
  token_hash: string;

  @Column({ type: 'datetime' })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
