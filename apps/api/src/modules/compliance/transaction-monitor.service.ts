import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmlAlert } from './entities/aml-alert.entity';
import { FiatDeposit } from '../fiat-gateway/entities/fiat-deposit.entity';
import { FiatWithdrawal } from '../fiat-gateway/entities/fiat-withdrawal.entity';

@Injectable()
export class TransactionMonitorService {
  private readonly logger = new Logger(TransactionMonitorService.name);

  constructor(
    @InjectRepository(AmlAlert) private alertRepo: Repository<AmlAlert>,
    @InjectRepository(FiatDeposit) private depositRepo: Repository<FiatDeposit>,
    @InjectRepository(FiatWithdrawal) private withdrawalRepo: Repository<FiatWithdrawal>,
  ) {}

  async checkTransaction(customerId: string, txType: string, amount: number): Promise<{
    approved: boolean; riskScore: number; alerts: string[];
  }> {
    let riskScore = 0;
    const alerts: string[] = [];

    // Rule 1: Large transaction (>= 1M KES)
    if (amount >= 1000000) {
      riskScore += 30;
      alerts.push('LARGE_TRANSACTION');
      await this.createAlert(customerId, 'LARGE_TRANSACTION', 'MEDIUM', `Transaction of KES ${amount.toLocaleString()}`);
    }

    // Rule 2: Velocity check (5+ transactions in 1 hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentCount = await this.depositRepo
      .createQueryBuilder('d')
      .where('d.customer_id = :id AND d.created_at > :since', { id: customerId, since: oneHourAgo })
      .getCount();
    if (recentCount >= 5) {
      riskScore += 25;
      alerts.push('VELOCITY_HOURLY');
      await this.createAlert(customerId, 'VELOCITY_HOURLY', 'HIGH', `${recentCount} transactions in 1 hour`);
    }

    // Rule 3: Structuring detection (multiple txns just below 1M)
    const last24h = new Date(Date.now() - 86400000);
    const nearThresholdCount = await this.depositRepo
      .createQueryBuilder('d')
      .where('d.customer_id = :id AND d.created_at > :since AND CAST(d.amount AS DECIMAL) BETWEEN 900000 AND 999999', {
        id: customerId, since: last24h,
      })
      .getCount();
    if (nearThresholdCount >= 3) {
      riskScore += 35;
      alerts.push('STRUCTURING');
      await this.createAlert(customerId, 'STRUCTURING', 'HIGH', `${nearThresholdCount} transactions near KES 1M threshold`);
    }

    const approved = riskScore < 50;
    this.logger.log(`Compliance check for ${customerId.slice(0, 8)}...: score=${riskScore}, approved=${approved}`);

    return { approved, riskScore, alerts };
  }

  private async createAlert(customerId: string, type: string, severity: string, description: string) {
    const alert = this.alertRepo.create({
      customer_id: customerId,
      alert_type: type,
      severity,
      rule_id: `RULE_${type}`,
      description,
      status: 'NEW',
    });
    await this.alertRepo.save(alert);
  }
}
