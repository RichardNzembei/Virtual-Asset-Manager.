import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmlAlert } from './entities/aml-alert.entity';
import { KycRecord } from './entities/kyc-record.entity';
import { Customer } from '../customers/entities/customer.entity';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @InjectRepository(AmlAlert) private alertRepo: Repository<AmlAlert>,
    @InjectRepository(KycRecord) private kycRepo: Repository<KycRecord>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) {}

  // --- AML Alerts ---
  async listAlerts(page = 1, limit = 20, status?: string, severity?: string) {
    const qb = this.alertRepo.createQueryBuilder('a')
      .leftJoinAndSelect('a.customer', 'c');
    if (status) qb.andWhere('a.status = :status', { status });
    if (severity) qb.andWhere('a.severity = :severity', { severity });
    const [data, total] = await qb
      .orderBy('a.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }

  async getAlert(id: string) {
    const alert = await this.alertRepo.findOne({ where: { id }, relations: ['customer'] });
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }

  async updateAlert(id: string, params: { status: string; resolution_notes?: string; assigned_to?: string; resolved_by?: string }) {
    const alert = await this.getAlert(id);
    alert.status = params.status;
    if (params.resolution_notes) alert.resolution_notes = params.resolution_notes;
    if (params.assigned_to) alert.assigned_to = params.assigned_to;
    if (params.resolved_by) alert.resolved_by = params.resolved_by;
    if (['RESOLVED', 'FALSE_POSITIVE'].includes(params.status)) {
      alert.resolved_at = new Date();
    }
    return this.alertRepo.save(alert);
  }

  async getAlertStats() {
    const stats = await this.alertRepo
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('a.status')
      .getRawMany();
    return stats;
  }

  // --- KYC ---
  async getKycRecords(customerId: string) {
    return this.kycRepo.find({
      where: { customer_id: customerId },
      order: { created_at: 'DESC' },
    });
  }

  async reviewKyc(customerId: string, params: { kyc_level: number; status: string; verifier: string }) {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const record = this.kycRepo.create({
      customer_id: customerId,
      kyc_level: params.kyc_level,
      verification_method: 'MANUAL_REVIEW',
      verification_result: params.status,
      verifier: params.verifier,
      verified_at: new Date(),
      status: 'ACTIVE',
    });
    await this.kycRepo.save(record);

    if (params.status === 'APPROVED') {
      customer.kyc_level = params.kyc_level;
      customer.kyc_status = 'VERIFIED';
      await this.customerRepo.save(customer);
    }

    return { record, customer };
  }

  // --- Reports ---
  async generateReport(type: string, startDate: string, endDate: string) {
    const report = {
      id: `RPT-${Date.now()}`,
      type,
      period: { start: startDate, end: endDate },
      generated_at: new Date().toISOString(),
      status: 'GENERATED',
      summary: {} as any,
    };

    switch (type) {
      case 'STR':
        const strAlerts = await this.alertRepo.count({
          where: { alert_type: 'STRUCTURING' },
        });
        report.summary = {
          total_suspicious_transactions: strAlerts,
          filed_reports: strAlerts,
          recipient: 'FRC (Financial Reporting Centre)',
        };
        break;
      case 'CTR':
        const ctrAlerts = await this.alertRepo.count({
          where: { alert_type: 'LARGE_TRANSACTION' },
        });
        report.summary = {
          total_large_transactions: ctrAlerts,
          threshold: 'KES 1,000,000',
          recipient: 'FRC',
        };
        break;
      case 'VASP_MONTHLY':
        report.summary = {
          total_customers: await this.customerRepo.count(),
          active_alerts: await this.alertRepo.count({ where: { status: 'NEW' } }),
          investigating: await this.alertRepo.count({ where: { status: 'INVESTIGATING' } }),
          recipient: 'CMA',
        };
        break;
    }

    return report;
  }
}
