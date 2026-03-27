import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { FiatGatewayService } from './fiat-gateway.service';
import { LinkBankAccountDto } from './dto/link-bank-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('fiat/bank-accounts')
@UseGuards(JwtAuthGuard)
export class BankAccountsController {
  constructor(private service: FiatGatewayService) {}

  @Post()
  async link(@Body() dto: LinkBankAccountDto) {
    const account = await this.service.linkBankAccount(dto);
    return { success: true, data: account };
  }

  @Get()
  async list(@Query('wallet_id') walletId: string) {
    const accounts = await this.service.listBankAccounts(walletId);
    return { success: true, data: accounts };
  }
}
