import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendPushNotification(customerId: string, title: string, body: string): Promise<void> {
    this.logger.log(`[PUSH] To ${customerId.slice(0, 8)}...: ${title} — ${body}`);
  }

  async sendSms(phone: string, message: string): Promise<void> {
    this.logger.log(`[SMS] To ${phone}: ${message}`);
  }

  async sendEmail(email: string, subject: string, body: string): Promise<void> {
    this.logger.log(`[EMAIL] To ${email}: ${subject}`);
  }
}
