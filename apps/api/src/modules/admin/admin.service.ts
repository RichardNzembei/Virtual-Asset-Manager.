import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from './entities/admin-user.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Order } from '../trading/entities/order.entity';
import { Trade } from '../trading/entities/trade.entity';
import { AmlAlert } from '../compliance/entities/aml-alert.entity';
import { TokenizedAsset } from '../tokenization/entities/tokenized-asset.entity';
import { FiatDeposit } from '../fiat-gateway/entities/fiat-deposit.entity';
import { FiatWithdrawal } from '../fiat-gateway/entities/fiat-withdrawal.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminUser) private adminRepo: Repository<AdminUser>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Trade) private tradeRepo: Repository<Trade>,
    @InjectRepository(AmlAlert) private alertRepo: Repository<AmlAlert>,
    @InjectRepository(TokenizedAsset) private tokenizedAssetRepo: Repository<TokenizedAsset>,
    @InjectRepository(FiatDeposit) private depositRepo: Repository<FiatDeposit>,
    @InjectRepository(FiatWithdrawal) private withdrawalRepo: Repository<FiatWithdrawal>,
  ) {}

  async getDashboard() {
    const [
      totalCustomers,
      activeWallets,
      openOrders,
      totalTrades,
      newAlerts,
      activeOfferings,
      pendingDeposits,
      pendingWithdrawals,
    ] = await Promise.all([
      this.customerRepo.count(),
      this.walletRepo.count({ where: { status: 'ACTIVE' } }),
      this.orderRepo.count({ where: { status: 'OPEN' } }),
      this.tradeRepo.count(),
      this.alertRepo.count({ where: { status: 'NEW' } }),
      this.tokenizedAssetRepo.count({ where: { status: 'ACTIVE' } }),
      this.depositRepo.count({ where: { status: 'PROCESSING' } }),
      this.withdrawalRepo.count({ where: { status: 'PROCESSING' } }),
    ]);

    return {
      total_customers: totalCustomers,
      active_wallets: activeWallets,
      open_orders: openOrders,
      total_trades: totalTrades,
      new_alerts: newAlerts,
      active_offerings: activeOfferings,
      pending_deposits: pendingDeposits,
      pending_withdrawals: pendingWithdrawals,
      system_health: {
        'identity-service': { status: 'UP', latency_ms: 48 },
        'wallet-service': { status: 'UP', latency_ms: 52 },
        'trading-service': { status: 'UP', latency_ms: 12 },
        'fiat-gateway-service': { status: 'UP', latency_ms: 210 },
        'tokenization-service': { status: 'UP', latency_ms: 88 },
        'compliance-service': { status: 'UP', latency_ms: 340 },
        'core-banking-bridge': { status: 'UP', latency_ms: 195 },
        'blockchain-indexer': { status: 'UP', latency_ms: 22 },
        'notification-service': { status: 'UP', latency_ms: 65 },
      },
      validators: [
        { name: 'Validator 1', operator: 'Riverbank (Nairobi)', peers: '3/3', lag: '0 blocks', status: 'HEALTHY' },
        { name: 'Validator 2', operator: 'KCB Infrastructure', peers: '3/3', lag: '0 blocks', status: 'HEALTHY' },
        { name: 'Validator 3', operator: 'DR Site (Mombasa)', peers: '3/3', lag: '1 block', status: 'HEALTHY' },
        { name: 'Validator 4', operator: 'CMA Observer (RO)', peers: '3/3', lag: '0 blocks', status: 'HEALTHY' },
      ],
      liquidity_pools: [
        { pool: 'KES Float (T24)', balance: 'KES 42,000,000', threshold: 'KES 10,000,000', status: 'ADEQUATE' },
        { pool: 'tKES Reserve', balance: '42,000,000 tKES', threshold: '1:1 KES', status: 'BALANCED' },
        { pool: 'BTC Hot Wallet', balance: '3.82 BTC', threshold: '1.00 BTC', status: 'ADEQUATE' },
        { pool: 'ETH Hot Wallet', balance: '38.5 ETH', threshold: '10.0 ETH', status: 'ADEQUATE' },
      ],
    };
  }
}
