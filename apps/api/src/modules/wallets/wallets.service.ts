import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletAddress } from './entities/wallet-address.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { BalanceLedger } from './entities/balance-ledger.entity';
import { Asset } from './entities/asset.entity';
import { CustodyMockService } from '../../integrations/custody/custody-mock.service';
import { BlockchainMockService } from '../../integrations/blockchain/blockchain-mock.service';
import { T24MockService } from '../../integrations/core-banking/t24-mock.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    @InjectRepository(WalletAddress) private addressRepo: Repository<WalletAddress>,
    @InjectRepository(WalletBalance) private balanceRepo: Repository<WalletBalance>,
    @InjectRepository(BalanceLedger) private ledgerRepo: Repository<BalanceLedger>,
    @InjectRepository(Asset) private assetRepo: Repository<Asset>,
    private dataSource: DataSource,
    private custodyService: CustodyMockService,
    private blockchainService: BlockchainMockService,
    private t24Service: T24MockService,
  ) {}

  async provisionWallet(customerId: string, walletType = 'USER', walletName?: string): Promise<Wallet> {
    // Check if user already has a wallet of this type
    const existing = await this.walletRepo.findOne({
      where: { customer_id: customerId, wallet_type: walletType },
    });
    if (existing && walletType === 'USER') {
      return existing;
    }

    // MPC key ceremony
    const mpcResult = await this.custodyService.initiateMpcKeyCeremony(customerId);

    // Create wallet
    const wallet = this.walletRepo.create({
      customer_id: customerId,
      wallet_type: walletType,
      wallet_name: walletName || `${walletType} Wallet`,
      status: 'ACTIVE',
      mpc_key_id: mpcResult.keyId,
      activated_at: new Date(),
    });
    const saved = await this.walletRepo.save(wallet);

    // Derive addresses for each chain
    const chains = ['TRAMIA', 'ETH', 'BTC'];
    for (const chain of chains) {
      const address = this.custodyService.deriveAddress(mpcResult.keyId, chain);
      const derivationPath = this.custodyService.deriveDerivationPath(chain);
      await this.addressRepo.save(
        this.addressRepo.create({
          wallet_id: saved.id,
          chain,
          address,
          derivation_path: derivationPath,
          is_primary: true,
        }),
      );
    }

    // Register on-chain identity
    const tramiaAddr = this.custodyService.deriveAddress(mpcResult.keyId, 'TRAMIA');
    await this.blockchainService.registerIdentity({
      address: tramiaAddr,
      identityHash: customerId,
    });

    // Initialize zero balances for all tradeable assets
    const assets = await this.assetRepo.find({ where: { status: 'ACTIVE' } });
    for (const asset of assets) {
      const existing = await this.balanceRepo.findOne({
        where: { wallet_id: saved.id, asset_id: asset.id },
      });
      if (!existing) {
        await this.balanceRepo.save(
          this.balanceRepo.create({
            wallet_id: saved.id,
            asset_id: asset.id,
            available: '0',
            pending: '0',
            locked: '0',
            staked: '0',
          }),
        );
      }
    }

    this.logger.log(`Wallet provisioned: ${saved.id} for customer ${customerId}`);
    return saved;
  }

  async findOne(id: string): Promise<Wallet> {
    const w = await this.walletRepo.findOne({
      where: { id },
      relations: ['addresses', 'customer'],
    });
    if (!w) throw new NotFoundException('Wallet not found');
    return w;
  }

  async findByCustomer(customerId: string): Promise<Wallet | null> {
    return this.walletRepo.findOne({
      where: { customer_id: customerId, wallet_type: 'USER' },
      relations: ['addresses'],
    });
  }

  async getBalances(walletId: string) {
    return this.balanceRepo.find({
      where: { wallet_id: walletId },
      relations: ['asset'],
    });
  }

  async getUnifiedBalance(walletId: string, bankAccountNumber?: string) {
    const wallet = await this.findOne(walletId);
    const balances = await this.getBalances(walletId);

    // Mock fiat balance from T24
    const fiatBalance = await this.t24Service.queryBalance(bankAccountNumber || 'default');

    const digitalBalances = balances.map((b) => ({
      asset: b.asset?.symbol || 'UNKNOWN',
      available: b.available,
      pending: b.pending,
      locked: b.locked,
      value_kes: this.estimateKesValue(b.asset?.symbol, parseFloat(b.available)),
    }));

    const totalDigital = digitalBalances.reduce((sum, b) => sum + b.value_kes, 0);

    return {
      wallet_id: walletId,
      customer_id: wallet.customer_id,
      timestamp: new Date().toISOString(),
      fiat_balances: [{
        account_number: bankAccountNumber || '****3891',
        account_type: 'SAVINGS',
        currency: 'KES',
        available: fiatBalance.available,
        current: fiatBalance.current,
        source: 'T24',
      }],
      digital_balances: digitalBalances,
      total_value_kes: fiatBalance.available + totalDigital,
    };
  }

  async updateBalance(
    walletId: string,
    assetId: string,
    balanceType: 'available' | 'pending' | 'locked' | 'staked',
    amount: number,
    referenceType: string,
    referenceId: string,
    idempotencyKey?: string,
  ): Promise<WalletBalance> {
    return this.dataSource.transaction(async (manager) => {
      // Check idempotency
      if (idempotencyKey) {
        const existing = await manager.findOne(BalanceLedger, {
          where: { idempotency_key: idempotencyKey },
        });
        if (existing) {
          return manager.findOne(WalletBalance, {
            where: { wallet_id: walletId, asset_id: assetId },
          }) as Promise<WalletBalance>;
        }
      }

      // Lock the balance row
      const balance = await manager
        .createQueryBuilder(WalletBalance, 'wb')
        .setLock('pessimistic_write')
        .where('wb.wallet_id = :walletId AND wb.asset_id = :assetId', { walletId, assetId })
        .getOne();

      if (!balance) throw new NotFoundException('Balance record not found');

      const before = parseFloat(balance[balanceType]);
      const after = before + amount;
      if (after < 0) throw new ConflictException(`Insufficient ${balanceType} balance`);

      // Write ledger entry
      await manager.save(BalanceLedger, {
        wallet_id: walletId,
        asset_id: assetId,
        entry_type: amount >= 0 ? 'CREDIT' : 'DEBIT',
        balance_type: balanceType,
        amount: Math.abs(amount).toString(),
        balance_before: before.toString(),
        balance_after: after.toString(),
        reference_type: referenceType,
        reference_id: referenceId,
        idempotency_key: idempotencyKey || undefined,
      });

      // Update balance
      balance[balanceType] = after.toString();
      balance.version += 1;
      return manager.save(WalletBalance, balance);
    });
  }

  async getTransactions(walletId: string, page = 1, limit = 20) {
    const [data, total] = await this.ledgerRepo
      .createQueryBuilder('bl')
      .where('bl.wallet_id = :walletId', { walletId })
      .orderBy('bl.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }

  private estimateKesValue(symbol: string | undefined, amount: number): number {
    const prices: Record<string, number> = {
      BTC: 13000000,
      ETH: 450000,
      tKES: 1,
      USDC: 129,
      USDT: 129,
    };
    return amount * (prices[symbol || ''] || 0);
  }
}
