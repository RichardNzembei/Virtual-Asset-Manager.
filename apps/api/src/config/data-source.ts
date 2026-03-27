import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.S_DATABASE_HOST || 'localhost',
  port: parseInt(process.env.S_DATABASE_PORT || '3306', 10),
  username: process.env.S_DATABASE_USER || 'siku_zangu',
  password: process.env.S_DATABASE_PASSWORD || 'Saint@mysql4',
  database: process.env.S_DATABASE_NAME || 'tramia_dev',
  entities: [path.join(__dirname, '..', '**', '*.entity.{ts,js}')],
  synchronize: false,
  logging: false,
});
