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

export interface T24CustomerProfile {
  cif: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  national_id: string;
  kyc_level: number;
  kyc_status: string;
  customer_type: string;
  accounts: Array<{
    account_number: string;
    account_name: string;
    account_type: string;
    currency: string;
    status: string;
  }>;
}

@Injectable()
export class T24MockService {
  private readonly logger = new Logger(T24MockService.name);

  private readonly mockBalances: Record<string, BankBalanceResult> = {
    default: { available: 150000, current: 152000, currency: 'KES' },
  };

  private readonly mockProfiles: Record<string, T24CustomerProfile> = {
    '+254700000001': {
      cif: 'KCB-00423891', first_name: 'Amara', last_name: 'Osei',
      email: 'amara@demo.tramia.io', phone: '+254700000001', national_id: '12345678',
      kyc_level: 2, kyc_status: 'VERIFIED', customer_type: 'INDIVIDUAL',
      accounts: [{ account_number: '0423891001', account_name: 'Amara Osei - Savings', account_type: 'SAVINGS', currency: 'KES', status: 'ACTIVE' }],
    },
    '+254700000002': {
      cif: 'KCB-00567234', first_name: 'James', last_name: 'Mwangi',
      email: 'james@demo.tramia.io', phone: '+254700000002', national_id: '87654321',
      kyc_level: 3, kyc_status: 'VERIFIED', customer_type: 'INDIVIDUAL',
      accounts: [{ account_number: '0567234001', account_name: 'James Mwangi - Current', account_type: 'CURRENT', currency: 'KES', status: 'ACTIVE' }],
    },
    '+254700000003': {
      cif: 'KCB-00891456', first_name: 'Fatuma', last_name: 'Hassan',
      email: 'fatuma@demo.tramia.io', phone: '+254700000003', national_id: '11223344',
      kyc_level: 2, kyc_status: 'VERIFIED', customer_type: 'INDIVIDUAL',
      accounts: [{ account_number: '0891456001', account_name: 'Fatuma Hassan - Savings', account_type: 'SAVINGS', currency: 'KES', status: 'ACTIVE' }],
    },
  };

  private readonly mockAccountNames: Record<string, string> = {
    '0423891001': 'Amara Osei - Savings',
    '0567234001': 'James Mwangi - Current',
    '0891456001': 'Fatuma Hassan - Savings',
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

  async getCustomerProfile(phone: string): Promise<T24CustomerProfile> {
    await this.delay(400);
    const profile = this.mockProfiles[phone];
    if (profile) {
      this.logger.log(`T24 customer profile fetched for ${phone}: ${profile.first_name} ${profile.last_name}`);
      return profile;
    }
    // Generate deterministic profile for unknown phones
    const last8 = phone.replace(/\D/g, '').slice(-8);
    const generated: T24CustomerProfile = {
      cif: `KCB-${last8}`,
      first_name: 'KCB',
      last_name: `Customer ${last8.slice(-4)}`,
      email: `customer${last8.slice(-4)}@kcb.co.ke`,
      phone,
      national_id: last8,
      kyc_level: 1,
      kyc_status: 'VERIFIED',
      customer_type: 'INDIVIDUAL',
      accounts: [{
        account_number: `${last8}001`,
        account_name: `KCB Customer ${last8.slice(-4)} - Savings`,
        account_type: 'SAVINGS',
        currency: 'KES',
        status: 'ACTIVE',
      }],
    };
    this.logger.log(`T24 generated profile for new customer ${phone}: ${generated.cif}`);
    return generated;
  }

  async verifyAccount(accountNumber: string): Promise<{ verified: boolean; accountName: string }> {
    await this.delay(300);
    const name = this.mockAccountNames[accountNumber] || `KCB Account ${accountNumber.slice(-4)}`;
    return { verified: true, accountName: name };
  }

  setMockBalance(accountNumber: string, balance: BankBalanceResult) {
    this.mockBalances[accountNumber] = balance;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
