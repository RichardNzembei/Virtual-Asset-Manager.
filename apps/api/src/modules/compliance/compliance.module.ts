import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmlAlert } from './entities/aml-alert.entity';
import { KycRecord } from './entities/kyc-record.entity';
import { Customer } from '../customers/entities/customer.entity';
import { FiatDeposit } from '../fiat-gateway/entities/fiat-deposit.entity';
import { FiatWithdrawal } from '../fiat-gateway/entities/fiat-withdrawal.entity';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { TransactionMonitorService } from './transaction-monitor.service';
import { SanctionsService } from './sanctions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AmlAlert, KycRecord, Customer, FiatDeposit, FiatWithdrawal]),
  ],
  controllers: [ComplianceController],
  providers: [ComplianceService, TransactionMonitorService, SanctionsService],
  exports: [ComplianceService, TransactionMonitorService, SanctionsService],
})
export class ComplianceModule {}
