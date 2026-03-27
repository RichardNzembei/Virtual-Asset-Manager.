import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('wallets')
export class WalletsController {
  constructor(private service: WalletsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateWalletDto, @CurrentUser() user: any) {
    const customerId = dto.customer_id || user.customer_id;
    const wallet = await this.service.provisionWallet(customerId, dto.wallet_type, dto.wallet_name);
    return { success: true, data: wallet, message: 'Wallet provisioned successfully' };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const wallet = await this.service.findOne(id);
    return { success: true, data: wallet };
  }

  @Get(':id/balances')
  @UseGuards(JwtAuthGuard)
  async getBalances(@Param('id') id: string) {
    const balances = await this.service.getBalances(id);
    return { success: true, data: balances };
  }

  @Get(':id/balances/unified')
  @UseGuards(JwtAuthGuard)
  async getUnifiedBalance(@Param('id') id: string, @Query('bank_account') bankAccount?: string) {
    const unified = await this.service.getUnifiedBalance(id, bankAccount);
    return { success: true, data: unified };
  }

  @Get(':id/transactions')
  @UseGuards(JwtAuthGuard)
  async getTransactions(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.service.getTransactions(id, page, limit);
    return { success: true, data: result.data, meta: { page, limit, total: result.total } };
  }

  @Get(':id/addresses')
  @UseGuards(JwtAuthGuard)
  async getAddresses(@Param('id') id: string) {
    const wallet = await this.service.findOne(id);
    return { success: true, data: wallet.addresses };
  }
}
