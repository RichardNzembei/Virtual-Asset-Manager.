import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import * as path from 'path';

// Entities
import { Customer } from './modules/customers/entities/customer.entity';
import { Asset } from './modules/wallets/entities/asset.entity';
import { Wallet } from './modules/wallets/entities/wallet.entity';
import { WalletAddress } from './modules/wallets/entities/wallet-address.entity';
import { WalletBalance } from './modules/wallets/entities/wallet-balance.entity';
import { BalanceLedger } from './modules/wallets/entities/balance-ledger.entity';
import { LinkedBankAccount } from './modules/fiat-gateway/entities/linked-bank-account.entity';
import { FiatDeposit } from './modules/fiat-gateway/entities/fiat-deposit.entity';
import { FiatWithdrawal } from './modules/fiat-gateway/entities/fiat-withdrawal.entity';
import { TradingPair } from './modules/trading/entities/trading-pair.entity';
import { Order } from './modules/trading/entities/order.entity';
import { Trade } from './modules/trading/entities/trade.entity';
import { Issuer } from './modules/tokenization/entities/issuer.entity';
import { TokenizedAsset } from './modules/tokenization/entities/tokenized-asset.entity';
import { RealEstateAsset } from './modules/tokenization/entities/real-estate-asset.entity';
import { TokenHolding } from './modules/tokenization/entities/token-holding.entity';
import { Investment } from './modules/tokenization/entities/investment.entity';
import { KycRecord } from './modules/compliance/entities/kyc-record.entity';
import { AmlAlert } from './modules/compliance/entities/aml-alert.entity';
import { AdminUser } from './modules/admin/entities/admin-user.entity';
import { Session } from './modules/auth/entities/session.entity';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { FiatGatewayModule } from './modules/fiat-gateway/fiat-gateway.module';
import { TradingModule } from './modules/trading/trading.module';
import { TokenizationModule } from './modules/tokenization/tokenization.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IntegrationsModule } from './integrations/integrations.module';

const entities = [
  Customer, Asset, Wallet, WalletAddress, WalletBalance, BalanceLedger,
  LinkedBankAccount, FiatDeposit, FiatWithdrawal,
  TradingPair, Order, Trade,
  Issuer, TokenizedAsset, RealEstateAsset, TokenHolding, Investment,
  KycRecord, AmlAlert, AdminUser, Session,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: path.resolve(__dirname, '../../../.env'),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        entities,
        synchronize: true, // For demo purposes — auto-create tables
        logging: false,
      }),
    }),
    IntegrationsModule,
    NotificationsModule,
    AuthModule,
    CustomersModule,
    WalletsModule,
    FiatGatewayModule,
    TradingModule,
    TokenizationModule,
    ComplianceModule,
    AdminModule,
  ],
})
export class AppModule {}
