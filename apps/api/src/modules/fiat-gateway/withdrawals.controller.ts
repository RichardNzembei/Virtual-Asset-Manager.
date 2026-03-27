import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FiatGatewayService } from './fiat-gateway.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('fiat/withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalsController {
  constructor(private service: FiatGatewayService) {}

  @Post()
  async create(@Body() dto: CreateWithdrawalDto, @CurrentUser() user: any) {
    const withdrawal = await this.service.createWithdrawal({
      wallet_id: dto.wallet_id,
      customer_id: user.customer_id || user.id,
      destination_account_id: dto.destination_account_id,
      source_amount: dto.source_amount,
      source_asset: dto.source_asset,
      idempotency_key: dto.idempotency_key,
    });
    return {
      success: true,
      data: withdrawal,
      message: 'Withdrawal initiated',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const withdrawal = await this.service.getWithdrawal(id);
    return { success: true, data: withdrawal };
  }

  @Get()
  async list(@Query('wallet_id') walletId: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    const result = await this.service.listWithdrawals(walletId, page, limit);
    return { success: true, data: result.data, meta: { page, limit, total: result.total } };
  }
}
