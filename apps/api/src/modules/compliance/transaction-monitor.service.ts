import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmlAlert } from './entities/aml-alert.entity';
import { FiatDeposit } from '../fiat-gateway/entities/fiat-deposit.entity';
import { FiatWithdrawal } from '../fiat-gateway/entities/fiat-withdrawal.entity';
import { Customer } from '../customers/entities/customer.entity';
import { SanctionsService } from './sanctions.service';
import { BlockchainMockService } from '../../integrations/blockchain/blockchain-mock.service';

export interface TravelRuleData {
  originator_name: string;
  originator_account: string;
  originator_institution: string;
  beneficiary_name: string;
  beneficiary_account: string;
  beneficiary_institution: string;
  amount: number;
  currency: string;
  timestamp: string;
}

export interface AmlCheckResult {
  approved: boolean;
  riskScore: number;
  alerts: string[];
  sanctions: { matched: boolean; matchedList?: string; checkedLists: string[] };
  travelRuleApplied: boolean;
  travelRuleData?: TravelRuleData;
  onChainTxHash: string;
}

@Injectable()
export class TransactionMonitorService {
  private readonly logger = new Logger(TransactionMonitorService.name);
  private readonly TRAVEL_RULE_THRESHOLD = 130000; // KES ~$1,000 FATF threshold

  constructor(
    @InjectRepository(AmlAlert) private alertRepo: Repository<AmlAlert>,
    @InjectRepository(FiatDeposit) private depositRepo: Repository<FiatDeposit>,
    @InjectRepository(FiatWithdrawal) private withdrawalRepo: Repository<FiatWithdrawal>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    private sanctionsService: SanctionsService,
    private blockchainService: BlockchainMockService,
  ) {}

  async checkTransaction(customerId: string, txType: string, amount: number): Promise<AmlCheckResult> {
    let riskScore = 0;
    const alerts: string[] = [];
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });

    // ============================================================
    // 1. SANCTIONS SCREENING (OFAC, UN, EU, FRC Kenya)
    // ============================================================
    let sanctionsResult: { matched: boolean; matchedList?: string; matchScore?: number; checkedLists: string[] } = { matched: false, checkedLists: [] };
    if (customer) {
      sanctionsResult = await this.sanctionsService.screenPerson({
        name: `${customer.first_name} ${customer.last_name}`,
        nationalId: customer.national_id || undefined,
      });
      if (sanctionsResult.matched) {
        riskScore = 100;
        alerts.push('SANCTIONS_MATCH');
        await this.createAlert(customerId, 'SANCTIONS_MATCH', 'CRITICAL',
          `Sanctions match: ${sanctionsResult.matchedList} — ${customer.first_name} ${customer.last_name}`,
          { list: sanctionsResult.matchedList, score: (sanctionsResult as any).matchScore },
        );
        await this.updateRiskScore(customerId, 100);
        const onChain = await this.blockchainService.logAmlCheck({ userId: customerId, passed: false, riskScore: 100, checkType: 'SANCTIONS_BLOCK' });
        return { approved: false, riskScore: 100, alerts, sanctions: sanctionsResult, travelRuleApplied: false, onChainTxHash: onChain.txHash };
      }
    }

    // ============================================================
    // 2. TRANSACTION PATTERN CHECKS
    // ============================================================

    // Large transaction (>= 1M KES)
    if (amount >= 1000000) {
      riskScore += 30;
      alerts.push('LARGE_TRANSACTION');
      await this.createAlert(customerId, 'LARGE_TRANSACTION', 'MEDIUM', `${txType} of KES ${amount.toLocaleString()}`);
    }

    // Velocity check (5+ transactions in 1 hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentDeposits = await this.depositRepo.createQueryBuilder('d')
      .where('d.customer_id = :id AND d.created_at > :since', { id: customerId, since: oneHourAgo }).getCount();
    const recentWithdrawals = await this.withdrawalRepo.createQueryBuilder('w')
      .where('w.customer_id = :id AND w.created_at > :since', { id: customerId, since: oneHourAgo }).getCount();
    if (recentDeposits + recentWithdrawals >= 5) {
      riskScore += 25;
      alerts.push('VELOCITY_HOURLY');
      await this.createAlert(customerId, 'VELOCITY_HOURLY', 'HIGH', `${recentDeposits + recentWithdrawals} transactions in 1 hour`);
    }

    // Structuring detection (3+ near-threshold txns in 24h)
    const last24h = new Date(Date.now() - 86400000);
    const nearThreshold = await this.depositRepo.createQueryBuilder('d')
      .where('d.customer_id = :id AND d.created_at > :since AND CAST(d.amount AS DECIMAL) BETWEEN 900000 AND 999999', { id: customerId, since: last24h })
      .getCount();
    if (nearThreshold >= 3) {
      riskScore += 35;
      alerts.push('STRUCTURING');
      await this.createAlert(customerId, 'STRUCTURING', 'HIGH',
        `${nearThreshold} transactions near KES 1M threshold in 24h — possible structuring`,
        { count: nearThreshold, threshold: 1000000 },
      );
    }

    // ============================================================
    // 3. TRAVEL RULE (FATF) — for transactions > KES 130,000
    // ============================================================
    let travelRuleApplied = false;
    let travelRuleData: TravelRuleData | undefined;

    if (amount > this.TRAVEL_RULE_THRESHOLD && customer) {
      travelRuleApplied = true;
      travelRuleData = {
        originator_name: `${customer.first_name} ${customer.last_name}`,
        originator_account: customer.bank_cif || customer.id,
        originator_institution: 'TRAMIA_VASP_KE',
        beneficiary_name: txType === 'deposit' ? 'TRAMIA Wallet' : `${customer.first_name} ${customer.last_name}`,
        beneficiary_account: txType === 'deposit' ? 'tramia-escrow' : customer.bank_cif || 'bank-account',
        beneficiary_institution: txType === 'deposit' ? 'TRAMIA_VASP_KE' : 'KCB_BANK_KE',
        amount,
        currency: 'KES',
        timestamp: new Date().toISOString(),
      };
      this.logger.log(`Travel rule applied: KES ${amount.toLocaleString()} ${txType} for ${customer.first_name} ${customer.last_name}`);
    }

    // ============================================================
    // 4. DYNAMIC RISK SCORE UPDATE (persisted on customer)
    // ============================================================
    const approved = riskScore < 50;
    if (customer) {
      const existing = customer.risk_score || 0;
      const blended = Math.round(existing * 0.7 + riskScore * 0.3);
      await this.updateRiskScore(customerId, blended);

      const category = blended >= 60 ? 'HIGH' : blended >= 30 ? 'MEDIUM' : 'LOW';
      if (customer.risk_category !== category) {
        await this.customerRepo.update(customerId, { risk_category: category });
      }
    }

    // ============================================================
    // 5. LOG AML CHECK ON BESU (permanent record)
    // ============================================================
    const onChain = await this.blockchainService.logAmlCheck({
      userId: customerId,
      passed: approved,
      riskScore,
      checkType: alerts.length > 0 ? alerts.join(',') : 'CLEAN',
    });

    this.logger.log(`AML complete: score=${riskScore}, approved=${approved}, sanctions=${sanctionsResult.matched}, travelRule=${travelRuleApplied}, alerts=[${alerts}], onChain=${onChain.txHash.slice(0, 14)}...`);

    return {
      approved,
      riskScore,
      alerts,
      sanctions: { matched: sanctionsResult.matched, matchedList: sanctionsResult.matchedList, checkedLists: sanctionsResult.checkedLists },
      travelRuleApplied,
      travelRuleData,
      onChainTxHash: onChain.txHash,
    };
  }

  private async updateRiskScore(customerId: string, score: number) {
    await this.customerRepo.update(customerId, { risk_score: Math.min(score, 100) });
  }

  private async createAlert(customerId: string, type: string, severity: string, description: string, details?: any) {
    await this.alertRepo.save(this.alertRepo.create({
      customer_id: customerId,
      alert_type: type,
      severity,
      rule_id: `RULE_${type}`,
      description,
      details: details || undefined,
      status: severity === 'CRITICAL' ? 'ESCALATED' : 'NEW',
    }));
  }
}
