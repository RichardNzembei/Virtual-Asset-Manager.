import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BankSsoDto } from './dto/bank-sso.dto';
import { OtpSendDto, OtpVerifyDto } from './dto/otp-verify.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('bank-sso')
  @HttpCode(HttpStatus.OK)
  async bankSso(@Body() dto: BankSsoDto) {
    const result = await this.authService.bankSsoLogin(dto.bank_token);
    return {
      success: true,
      data: {
        customer_id: result.customer.id,
        phone: result.customer.phone,
        needs_otp: result.needsOtp,
      },
      message: 'Bank SSO validated. Please verify OTP.',
    };
  }

  @Post('otp-send')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: OtpSendDto) {
    const result = await this.authService.sendOtp(dto.phone);
    return { success: result.success, data: { status: result.status } };
  }

  @Post('otp-verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: OtpVerifyDto) {
    const result = await this.authService.verifyOtp(dto.phone, dto.code);
    return {
      success: true,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        customer: {
          id: result.customer.id,
          first_name: result.customer.first_name,
          last_name: result.customer.last_name,
          kyc_level: result.customer.kyc_level,
        },
      },
    };
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() body: { email: string; password: string }) {
    const result = await this.authService.adminLogin(body.email, body.password);
    return { success: true, data: result };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(dto.refresh_token);
    return { success: true, data: result };
  }
}
