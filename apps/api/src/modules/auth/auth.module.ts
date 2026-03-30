import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Customer } from '../customers/entities/customer.entity';
import { AdminUser } from '../admin/entities/admin-user.entity';
import { Session } from './entities/session.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { FiatGatewayModule } from '../fiat-gateway/fiat-gateway.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiry') || '15m' },
      }),
    }),
    TypeOrmModule.forFeature([Customer, AdminUser, Session]),
    WalletsModule,
    FiatGatewayModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
