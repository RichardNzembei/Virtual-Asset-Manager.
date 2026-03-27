import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';

interface BankTransactionResult {
  success: boolean;
  transactionId: string;
  reference: string;
}

interface BankBalanceResult {
  available: number;
  current: number;
  currency: string;
}

@Injectable()
export class T24MockService {
  private readonly logger = new Logger(T24MockService.name);

  private readonly mockBalances: Record<string, BankBalanceResult> = {
    default: { available: 150000, current: 152000, currency: 'KES' },
  };

  async initiateDebit(params: {
    accountNumber: string; amount: number; reference: string; narrative: string;
  }): Promise<BankTransactionResult> {
    await this.delay(500);
    const txId = `T24-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomBytes(4).toString('hex')}`;
    this.logger.log(`T24 DEBIT ${params.accountNumber} KES ${params.amount} → ${txId}`);
    return { success: true, transactionId: txId, reference: params.reference };
  }

  async initiateCredit(params: {
    accountNumber: string; amount: number; reference: string; narrative: string;
  }): Promise<BankTransactionResult> {
    await this.delay(1000);
    const txId = `T24-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomBytes(4).toString('hex')}`;
    this.logger.log(`T24 CREDIT ${params.accountNumber} KES ${params.amount} → ${txId}`);
    return { success: true, transactionId: txId, reference: params.reference };
  }

  async queryBalance(accountNumber: string): Promise<BankBalanceResult> {
    await this.delay(200);
    return this.mockBalances[accountNumber] || this.mockBalances.default;
  }

  async verifyAccount(accountNumber: string): Promise<{ verified: boolean; accountName: string }> {
    await this.delay(300);
    return { verified: true, accountName: `KCB Account ${accountNumber.slice(-4)}` };
  }

  setMockBalance(accountNumber: string, balance: BankBalanceResult) {
    this.mockBalances[accountNumber] = balance;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
