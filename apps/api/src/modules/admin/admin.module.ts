import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from './entities/admin-user.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Order } from '../trading/entities/order.entity';
import { Trade } from '../trading/entities/trade.entity';
import { AmlAlert } from '../compliance/entities/aml-alert.entity';
import { TokenizedAsset } from '../tokenization/entities/tokenized-asset.entity';
import { FiatDeposit } from '../fiat-gateway/entities/fiat-deposit.entity';
import { FiatWithdrawal } from '../fiat-gateway/entities/fiat-withdrawal.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUser, Customer, Wallet, Order, Trade,
      AmlAlert, TokenizedAsset, FiatDeposit, FiatWithdrawal,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
