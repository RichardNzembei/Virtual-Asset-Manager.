import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { TwilioService } from './twilio.service';

@Global()
@Module({
  providers: [NotificationsService, TwilioService],
  exports: [NotificationsService, TwilioService],
})
export class NotificationsModule {}
