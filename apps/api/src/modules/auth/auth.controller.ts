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
        first_name: result.customer.first_name,
        last_name: result.customer.last_name,
        kyc_level: result.customer.kyc_level,
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
          email: result.customer.email,
          phone: result.customer.phone,
          national_id: result.customer.national_id,
          kyc_level: result.customer.kyc_level,
          kyc_status: result.customer.kyc_status,
          bank_cif: result.customer.bank_cif,
          risk_category: result.customer.risk_category,
        },
        wallet: result.wallet ? {
          id: result.wallet.id,
          status: result.wallet.status,
          wallet_name: result.wallet.wallet_name,
          addresses: (result.wallet.addresses || []).map((a: any) => ({
            chain: a.chain,
            address: a.address,
          })),
        } : null,
        balances: (result.balances || []).map((b: any) => ({
          asset_id: b.asset_id,
          symbol: b.asset?.symbol,
          name: b.asset?.name,
          available: b.available,
          pending: b.pending,
          locked: b.locked,
        })),
        bank_accounts: (result.bankAccounts || []).map((ba: any) => ({
          id: ba.id,
          bank_code: ba.bank_code,
          account_number: ba.account_number,
          account_name: ba.account_name,
          account_type: ba.account_type,
          is_primary: ba.is_primary,
        })),
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
