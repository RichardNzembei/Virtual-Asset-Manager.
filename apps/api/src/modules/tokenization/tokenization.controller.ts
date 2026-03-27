import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TokenizationService } from './tokenization.service';
import { SubmitAssetDto } from './dto/submit-asset.dto';
import { InvestDto } from './dto/invest.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('tokenization')
export class TokenizationController {
  constructor(private service: TokenizationService) {}

  @Post('assets')
  @UseGuards(JwtAuthGuard)
  async submit(@Body() dto: SubmitAssetDto, @CurrentUser() user: any) {
    const asset = await this.service.submitAsset(user.id, dto);
    return { success: true, data: asset, message: 'Asset submitted' };
  }

  @Get('assets/:id')
  async getAsset(@Param('id') id: string) {
    const asset = await this.service.getAssetWithDetails(id);
    return { success: true, data: asset };
  }

  @Put('assets/:id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() body: any) {
    // Simplified update for draft assets
    const asset = await this.service.findOne(id);
    Object.assign(asset, body);
    return { success: true, data: asset };
  }

  @Post('assets/:id/submit')
  @UseGuards(JwtAuthGuard)
  async submitForApproval(@Param('id') id: string) {
    const asset = await this.service.submitForApproval(id);
    return { success: true, data: asset, message: 'Submitted for approval' };
  }

  @Post('assets/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approve(@Param('id') id: string) {
    const asset = await this.service.approveAsset(id);
    return { success: true, data: asset, message: 'Asset approved and tokens minted' };
  }

  @Post('assets/:id/reject')
  @UseGuards(JwtAuthGuard)
  async reject(@Param('id') id: string, @Body() body: { notes?: string }) {
    const asset = await this.service.rejectAsset(id, body.notes);
    return { success: true, data: asset, message: 'Asset rejected' };
  }

  @Get('offerings')
  async listOfferings(@Query('page') page = 1, @Query('limit') limit = 20) {
    const result = await this.service.listOfferings(page, limit);
    return { success: true, data: result.data, meta: { page, limit, total: result.total } };
  }

  @Get('offerings/:id')
  async getOffering(@Param('id') id: string) {
    const asset = await this.service.getAssetWithDetails(id);
    return { success: true, data: asset };
  }

  @Post('offerings/:id/invest')
  @UseGuards(JwtAuthGuard)
  async invest(@Param('id') id: string, @Body() dto: InvestDto, @CurrentUser() user: any) {
    const result = await this.service.invest(id, dto.wallet_id, user.customer_id || user.id, dto.amount_kes);
    return { success: true, data: result, message: 'Investment completed' };
  }

  @Get('holdings')
  @UseGuards(JwtAuthGuard)
  async getHoldings(@CurrentUser() user: any) {
    const holdings = await this.service.getHoldings(user.customer_id || user.id);
    return { success: true, data: holdings };
  }
}
