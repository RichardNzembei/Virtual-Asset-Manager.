import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiatDeposit } from './entities/fiat-deposit.entity';
import { FiatWithdrawal } from './entities/fiat-withdrawal.entity';
import { LinkedBankAccount } from './entities/linked-bank-account.entity';
import { Asset } from '../wallets/entities/asset.entity';
import { FiatGatewayService } from './fiat-gateway.service';
import { DepositsController } from './deposits.controller';
import { WithdrawalsController } from './withdrawals.controller';
import { BankAccountsController } from './bank-accounts.controller';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FiatDeposit, FiatWithdrawal, LinkedBankAccount, Asset]),
    WalletsModule,
  ],
  controllers: [DepositsController, WithdrawalsController, BankAccountsController],
  providers: [FiatGatewayService],
  exports: [FiatGatewayService],
})
export class FiatGatewayModule {}
