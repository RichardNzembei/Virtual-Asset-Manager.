import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FiatDeposit } from './entities/fiat-deposit.entity';
import { FiatWithdrawal } from './entities/fiat-withdrawal.entity';
import { LinkedBankAccount } from './entities/linked-bank-account.entity';
import { WalletsService } from '../wallets/wallets.service';
import { BlockchainMockService } from '../../integrations/blockchain/blockchain-mock.service';
import { T24MockService } from '../../integrations/core-banking/t24-mock.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Asset } from '../wallets/entities/asset.entity';

@Injectable()
export class FiatGatewayService {
  private readonly logger = new Logger(FiatGatewayService.name);

  constructor(
    @InjectRepository(FiatDeposit) private depositRepo: Repository<FiatDeposit>,
    @InjectRepository(FiatWithdrawal) private withdrawalRepo: Repository<FiatWithdrawal>,
    @InjectRepository(LinkedBankAccount) private bankAccountRepo: Repository<LinkedBankAccount>,
    @InjectRepository(Asset) private assetRepo: Repository<Asset>,
    private walletsService: WalletsService,
    private blockchainService: BlockchainMockService,
    private t24Service: T24MockService,
    private notificationService: NotificationsService,
  ) {}

  // --- Deposits ---
  async createDeposit(params: {
    wallet_id: string;
    customer_id: string;
    source_account_id: string;
    amount: number;
    deposit_method?: string;
    idempotency_key?: string;
  }) {
    const method = params.deposit_method || 'BANK_TRANSFER';
    const feeRate = method === 'BANK_TRANSFER' ? 0.005 : 0.015;
    const fee = Math.max(params.amount * feeRate, 50);
    const net = params.amount - fee;
    const reference = `TRM-DEP-${Date.now()}-${uuidv4().slice(0, 5)}`;

    const deposit = this.depositRepo.create({
      wallet_id: params.wallet_id,
      customer_id: params.customer_id,
      source_account_id: params.source_account_id,
      deposit_method: method,
      amount: params.amount.toString(),
      fee_amount: fee.toFixed(2),
      net_amount: net.toFixed(2),
      target_asset: 'tKES',
      tokens_amount: net.toFixed(2),
      exchange_rate: '1.000000',
      internal_reference: reference,
      idempotency_key: params.idempotency_key || undefined,
      status: 'PROCESSING',
      compliance_status: 'APPROVED',
    });
    const saved = await this.depositRepo.save(deposit);

    // Process asynchronously (simulated)
    this.processDeposit(saved).catch((err) => this.logger.error(`Deposit failed: ${err.message}`));

    return saved;
  }

  private async processDeposit(deposit: FiatDeposit) {
    // 1. T24 debit
    const bankResult = await this.t24Service.initiateDebit({
      accountNumber: deposit.source_account_id,
      amount: parseFloat(deposit.amount),
      reference: deposit.internal_reference,
      narrative: `Tramia deposit ${deposit.internal_reference}`,
    });
    deposit.t24_transaction_id = bankResult.transactionId;

    // 2. Mint tKES on blockchain
    const tKES = await this.assetRepo.findOne({ where: { symbol: 'tKES' } });
    const mintResult = await this.blockchainService.mintTokens({
      tokenAddress: tKES?.contract_address || '0x0',
      recipient: deposit.wallet_id,
      amount: deposit.net_amount,
    });
    deposit.blockchain_tx_hash = mintResult.txHash;

    // 3. Credit wallet balance
    if (tKES) {
      await this.walletsService.updateBalance(
        deposit.wallet_id,
        tKES.id,
        'available',
        parseFloat(deposit.net_amount),
        'DEPOSIT',
        deposit.id,
        `dep-${deposit.id}`,
      );
    }

    // 4. Complete
    deposit.status = 'COMPLETED';
    deposit.completed_at = new Date();
    await this.depositRepo.save(deposit);

    await this.notificationService.sendPushNotification(
      deposit.customer_id,
      'Deposit Confirmed',
      `KES ${deposit.net_amount} has been credited to your Tramia wallet`,
    );
  }

  async getDeposit(id: string) {
    const d = await this.depositRepo.findOne({ where: { id } });
    if (!d) throw new NotFoundException('Deposit not found');
    return d;
  }

  async listDeposits(walletId: string, page = 1, limit = 20) {
    const [data, total] = await this.depositRepo.findAndCount({
      where: { wallet_id: walletId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  // --- Withdrawals ---
  async createWithdrawal(params: {
    wallet_id: string;
    customer_id: string;
    destination_account_id: string;
    source_amount: number;
    source_asset?: string;
    idempotency_key?: string;
  }) {
    const feeRate = 0.005;
    const fee = Math.max(params.source_amount * feeRate, 50);
    const net = params.source_amount - fee;
    const reference = `TRM-WDR-${Date.now()}-${uuidv4().slice(0, 5)}`;

    const withdrawal = this.withdrawalRepo.create({
      wallet_id: params.wallet_id,
      customer_id: params.customer_id,
      destination_account_id: params.destination_account_id,
      source_asset: params.source_asset || 'tKES',
      source_amount: params.source_amount.toString(),
      gross_amount: params.source_amount.toFixed(2),
      fee_amount: fee.toFixed(2),
      net_amount: net.toFixed(2),
      withdrawal_method: 'BANK_TRANSFER',
      internal_reference: reference,
      idempotency_key: params.idempotency_key || undefined,
      status: 'PROCESSING',
      compliance_status: 'APPROVED',
    });
    const saved = await this.withdrawalRepo.save(withdrawal);

    this.processWithdrawal(saved).catch((err) => this.logger.error(`Withdrawal failed: ${err.message}`));
    return saved;
  }

  private async processWithdrawal(withdrawal: FiatWithdrawal) {
    const tKES = await this.assetRepo.findOne({ where: { symbol: 'tKES' } });

    // 1. Debit wallet
    if (tKES) {
      await this.walletsService.updateBalance(
        withdrawal.wallet_id,
        tKES.id,
        'available',
        -parseFloat(withdrawal.source_amount),
        'WITHDRAWAL',
        withdrawal.id,
        `wdr-${withdrawal.id}`,
      );
    }

    // 2. Burn tKES
    const burnResult = await this.blockchainService.burnTokens({
      tokenAddress: tKES?.contract_address || '0x0',
      from: withdrawal.wallet_id,
      amount: withdrawal.source_amount,
    });
    withdrawal.blockchain_tx_hash = burnResult.txHash;

    // 3. T24 credit
    const bankResult = await this.t24Service.initiateCredit({
      accountNumber: withdrawal.destination_account_id,
      amount: parseFloat(withdrawal.net_amount),
      reference: withdrawal.internal_reference,
      narrative: `Tramia withdrawal ${withdrawal.internal_reference}`,
    });
    withdrawal.t24_transaction_id = bankResult.transactionId;

    // 4. Complete
    withdrawal.status = 'COMPLETED';
    withdrawal.completed_at = new Date();
    await this.withdrawalRepo.save(withdrawal);

    await this.notificationService.sendPushNotification(
      withdrawal.customer_id,
      'Withdrawal Completed',
      `KES ${withdrawal.net_amount} credited to your bank account`,
    );
  }

  async getWithdrawal(id: string) {
    const w = await this.withdrawalRepo.findOne({ where: { id } });
    if (!w) throw new NotFoundException('Withdrawal not found');
    return w;
  }

  async listWithdrawals(walletId: string, page = 1, limit = 20) {
    const [data, total] = await this.withdrawalRepo.findAndCount({
      where: { wallet_id: walletId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  // --- Bank Accounts ---
  async linkBankAccount(params: {
    wallet_id: string;
    customer_id: string;
    account_number: string;
    bank_code?: string;
    account_type?: string;
    is_primary?: boolean;
  }) {
    const verification = await this.t24Service.verifyAccount(params.account_number);
    const account = this.bankAccountRepo.create({
      wallet_id: params.wallet_id,
      customer_id: params.customer_id,
      bank_code: params.bank_code || 'KCB',
      account_number: params.account_number,
      account_name: verification.accountName,
      account_type: params.account_type || 'SAVINGS',
      is_primary: params.is_primary ?? false,
      is_verified: verification.verified,
      status: 'ACTIVE',
    });
    return this.bankAccountRepo.save(account);
  }

  async listBankAccounts(walletId: string) {
    return this.bankAccountRepo.find({ where: { wallet_id: walletId, status: 'ACTIVE' } });
  }

  async getAllDeposits(page = 1, limit = 20) {
    const [data, total] = await this.depositRepo.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['customer'],
    });
    return { data, total, page, limit };
  }

  async getAllWithdrawals(page = 1, limit = 20) {
    const [data, total] = await this.withdrawalRepo.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['customer'],
    });
    return { data, total, page, limit };
  }
}
