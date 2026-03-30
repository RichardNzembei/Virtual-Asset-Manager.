import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Customer } from '../customers/entities/customer.entity';
import { AdminUser } from '../admin/entities/admin-user.entity';
import { Session } from './entities/session.entity';
import { TwilioService } from '../notifications/twilio.service';
import { WalletsService } from '../wallets/wallets.service';
import { FiatGatewayService } from '../fiat-gateway/fiat-gateway.service';
import { T24MockService } from '../../integrations/core-banking/t24-mock.service';
import { createHash } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private pendingProfiles = new Map<string, { profile: any; expiresAt: number }>();

  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(AdminUser) private adminRepo: Repository<AdminUser>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    private jwtService: JwtService,
    private config: ConfigService,
    private twilioService: TwilioService,
    private t24Service: T24MockService,
    private walletsService: WalletsService,
    private fiatGatewayService: FiatGatewayService,
  ) {}

  async bankSsoLogin(bankToken: string) {
    const phone = bankToken.startsWith('+') ? bankToken : `+254${bankToken}`;

    // Fetch customer profile from KCB core banking (T24)
    const t24Profile = await this.t24Service.getCustomerProfile(phone);

    let customer = await this.customerRepo.findOne({ where: { phone } });
    if (!customer) {
      // Create customer from bank KYC data
      customer = this.customerRepo.create({
        phone,
        first_name: t24Profile.first_name,
        last_name: t24Profile.last_name,
        email: t24Profile.email,
        national_id: t24Profile.national_id,
        bank_cif: t24Profile.cif,
        customer_type: t24Profile.customer_type,
        kyc_level: t24Profile.kyc_level,
        kyc_status: t24Profile.kyc_status,
        status: 'ACTIVE',
      });
      customer = await this.customerRepo.save(customer);
      this.logger.log(`New customer provisioned from bank KYC: ${customer.id}`);
    } else {
      // Sync fresh data from bank on each login
      customer.first_name = t24Profile.first_name;
      customer.last_name = t24Profile.last_name;
      customer.email = t24Profile.email;
      customer.national_id = t24Profile.national_id;
      customer.bank_cif = t24Profile.cif;
      customer.kyc_level = t24Profile.kyc_level;
      customer.kyc_status = t24Profile.kyc_status;
      customer = await this.customerRepo.save(customer);
    }

    // Cache T24 profile for use in OTP step (bank account linking)
    this.pendingProfiles.set(phone, { profile: t24Profile, expiresAt: Date.now() + 600_000 });

    return { customer, needsOtp: true };
  }

  async sendOtp(phone: string) {
    return this.twilioService.sendOtp(phone);
  }

  async verifyOtp(phone: string, code: string) {
    const result = await this.twilioService.verifyOtp(phone, code);
    if (!result.success) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    const customer = await this.customerRepo.findOne({ where: { phone } });
    if (!customer) {
      throw new UnauthorizedException('Customer not found');
    }

    // Retrieve cached T24 profile (from bankSsoLogin step)
    const cached = this.pendingProfiles.get(phone);

    // Find or provision wallet
    let wallet = await this.walletsService.findByCustomer(customer.id);
    if (!wallet) {
      await this.walletsService.provisionWallet(customer.id, 'USER', `${customer.first_name}'s Wallet`);
      // Re-fetch with relations: provisionWallet() returns bare entity without 'addresses'.
      // findByCustomer() loads relations: ['addresses'].
      wallet = await this.walletsService.findByCustomer(customer.id);
    }

    // Auto-link bank account from T24 profile
    let bankAccounts = wallet ? await this.fiatGatewayService.listBankAccounts(wallet.id) : [];
    if (cached?.profile.accounts?.length && bankAccounts.length === 0 && wallet) {
      const acct = cached.profile.accounts[0];
      try {
        await this.fiatGatewayService.linkBankAccount({
          wallet_id: wallet.id,
          customer_id: customer.id,
          account_number: acct.account_number,
          bank_code: 'KCB',
          account_type: acct.account_type,
          is_primary: true,
        });
        bankAccounts = await this.fiatGatewayService.listBankAccounts(wallet.id);
      } catch (err: any) {
        this.logger.warn(`Bank account auto-link skipped: ${err.message}`);
        bankAccounts = await this.fiatGatewayService.listBankAccounts(wallet.id);
      }
    }

    // Fetch wallet balances (with asset relation for symbol/name)
    const balances = wallet ? await this.walletsService.getBalances(wallet.id) : [];

    // Clean up cached profile
    this.pendingProfiles.delete(phone);

    // Generate JWT tokens with wallet_id
    const tokens = await this.generateTokens(customer, wallet?.id);

    return { ...tokens, customer, wallet, balances, bankAccounts };
  }

  async adminLogin(email: string, password: string) {
    const admin = await this.adminRepo.findOne({ where: { email } });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    admin.last_login = new Date();
    await this.adminRepo.save(admin);

    const payload = {
      sub: admin.id,
      role: admin.role,
      user_type: 'ADMIN',
      email: admin.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.config.get('jwt.refreshSecret'),
        expiresIn: this.config.get('jwt.refreshExpiry'),
      }),
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('jwt.refreshSecret'),
      });
      const newPayload = {
        sub: payload.sub,
        role: payload.role,
        user_type: payload.user_type,
        customer_id: payload.customer_id,
        wallet_id: payload.wallet_id,
      };
      return {
        access_token: this.jwtService.sign(newPayload),
        refresh_token: this.jwtService.sign(newPayload, {
          secret: this.config.get('jwt.refreshSecret'),
          expiresIn: this.config.get('jwt.refreshExpiry'),
        }),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(customer: Customer, walletId?: string) {
    const payload = {
      sub: customer.id,
      role: 'CUSTOMER',
      user_type: 'CUSTOMER',
      customer_id: customer.id,
      wallet_id: walletId,
      phone: customer.phone,
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.config.get('jwt.refreshSecret'),
        expiresIn: this.config.get('jwt.refreshExpiry'),
      }),
    };
  }
}
