import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletAddress } from './entities/wallet-address.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { BalanceLedger } from './entities/balance-ledger.entity';
import { Asset } from './entities/asset.entity';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletAddress, WalletBalance, BalanceLedger, Asset]),
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService, TypeOrmModule],
})
export class WalletsModule {}
