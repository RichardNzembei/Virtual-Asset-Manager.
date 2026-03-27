import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private repo: Repository<Customer>,
  ) {}

  async findAll(page = 1, limit = 20, status?: string) {
    const qb = this.repo.createQueryBuilder('c');
    if (status) qb.where('c.status = :status', { status });
    const [data, total] = await qb
      .orderBy('c.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Customer> {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { phone } });
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const c = this.repo.create(dto);
    return this.repo.save(c);
  }

  async updateKycLevel(id: string, level: number, status: string) {
    const c = await this.findOne(id);
    c.kyc_level = level;
    c.kyc_status = status;
    return this.repo.save(c);
  }

  async count(): Promise<number> {
    return this.repo.count();
  }
}
