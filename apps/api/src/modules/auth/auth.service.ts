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
import { createHash } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(AdminUser) private adminRepo: Repository<AdminUser>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    private jwtService: JwtService,
    private config: ConfigService,
    private twilioService: TwilioService,
  ) {}

  async bankSsoLogin(bankToken: string) {
    // Simulate bank SSO: decode the "bank token" as a phone number for demo
    // In real implementation, this would validate against KCB's OAuth provider
    const phone = bankToken.startsWith('+') ? bankToken : `+254${bankToken}`;

    let customer = await this.customerRepo.findOne({ where: { phone } });
    if (!customer) {
      // Auto-provision customer from "bank KYC"
      customer = this.customerRepo.create({
        phone,
        first_name: 'New',
        last_name: 'Customer',
        bank_cif: `KCB-${Date.now()}`,
        customer_type: 'INDIVIDUAL',
        kyc_level: 2,
        kyc_status: 'VERIFIED',
        status: 'ACTIVE',
      });
      customer = await this.customerRepo.save(customer);
      this.logger.log(`New customer provisioned from bank SSO: ${customer.id}`);
    }

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

    const tokens = await this.generateTokens(customer);
    return { ...tokens, customer };
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

  private async generateTokens(customer: Customer) {
    const payload = {
      sub: customer.id,
      role: 'CUSTOMER',
      user_type: 'CUSTOMER',
      customer_id: customer.id,
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
