import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200, unique: true })
  email: string;

  @Column({ length: 255 })
  password_hash: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 30 })
  role: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @Column({ type: 'datetime', nullable: true })
  last_login: Date;

  @CreateDateColumn()
  created_at: Date;
}
