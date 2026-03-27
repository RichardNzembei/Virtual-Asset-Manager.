import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private client: Twilio.Twilio;
  private verifyServiceSid: string;

  constructor(private config: ConfigService) {
    const accountSid = this.config.get<string>('twilio.accountSid');
    const authToken = this.config.get<string>('twilio.authToken');
    this.verifyServiceSid = this.config.get<string>('twilio.verifyServiceSid') || '';

    if (accountSid && authToken) {
      this.client = Twilio.default(accountSid, authToken);
      this.logger.log('Twilio client initialized');
    } else {
      this.logger.warn('Twilio credentials not configured — OTP will be mocked');
    }
  }

  async sendOtp(phone: string): Promise<{ success: boolean; status: string }> {
    if (!this.client) {
      this.logger.log(`[MOCK] OTP sent to ${phone}`);
      return { success: true, status: 'pending' };
    }
    try {
      const verification = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({ to: phone, channel: 'sms' });
      this.logger.log(`OTP sent to ${phone} — status: ${verification.status}`);
      return { success: true, status: verification.status };
    } catch (error: any) {
      this.logger.error(`Failed to send OTP to ${phone}: ${error.message}`);
      return { success: false, status: 'failed' };
    }
  }

  async verifyOtp(phone: string, code: string): Promise<{ success: boolean; status: string }> {
    if (!this.client) {
      const valid = code === '123456';
      this.logger.log(`[MOCK] OTP verify for ${phone}: ${valid ? 'approved' : 'rejected'}`);
      return { success: valid, status: valid ? 'approved' : 'pending' };
    }
    try {
      const check = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({ to: phone, code });
      const approved = check.status === 'approved';
      this.logger.log(`OTP verify for ${phone}: ${check.status}`);
      return { success: approved, status: check.status };
    } catch (error: any) {
      this.logger.error(`Failed to verify OTP for ${phone}: ${error.message}`);
      return { success: false, status: 'failed' };
    }
  }
}
