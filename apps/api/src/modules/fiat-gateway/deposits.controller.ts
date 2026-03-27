import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FiatGatewayService } from './fiat-gateway.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('fiat/deposits')
@UseGuards(JwtAuthGuard)
export class DepositsController {
  constructor(private service: FiatGatewayService) {}

  @Post()
  async create(@Body() dto: CreateDepositDto, @CurrentUser() user: any) {
    const deposit = await this.service.createDeposit({
      wallet_id: dto.wallet_id,
      customer_id: user.customer_id || user.id,
      source_account_id: dto.source_account_id,
      amount: dto.amount,
      deposit_method: dto.deposit_method,
      idempotency_key: dto.idempotency_key,
    });
    return {
      success: true,
      data: deposit,
      message: 'Deposit initiated',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const deposit = await this.service.getDeposit(id);
    return { success: true, data: deposit };
  }

  @Get()
  async list(@Query('wallet_id') walletId: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    const result = await this.service.listDeposits(walletId, page, limit);
    return { success: true, data: result.data, meta: { page, limit, total: result.total } };
  }
}
