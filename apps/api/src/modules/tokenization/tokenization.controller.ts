import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TokenizationService } from './tokenization.service';
import { SubmitAssetDto } from './dto/submit-asset.dto';
import { InvestDto } from './dto/invest.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('tokenization')
export class TokenizationController {
  constructor(private service: TokenizationService) {}

  // --- Asset CRUD ---

  @Post('assets')
  @UseGuards(JwtAuthGuard)
  async submit(@Body() dto: SubmitAssetDto, @CurrentUser() user: any) {
    const asset = await this.service.submitAsset(user.id, dto);
    return { success: true, data: asset, message: 'Asset submitted as DRAFT' };
  }

  @Get('assets')
  async listAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    const result = await this.service.listAll(page, limit);
    return { success: true, data: result.data, meta: { page, limit, total: result.total } };
  }

  @Get('assets/:id')
  async getAsset(@Param('id') id: string) {
    const asset = await this.service.getAssetWithDetails(id);
    return { success: true, data: asset };
  }

  @Put('assets/:id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() body: any) {
    const asset = await this.service.findOne(id);
    Object.assign(asset, body);
    return { success: true, data: asset };
  }

  // --- Phase 1: Submit for approval ---
  @Post('assets/:id/submit')
  @UseGuards(JwtAuthGuard)
  async submitForApproval(@Param('id') id: string) {
    const asset = await this.service.submitForApproval(id);
    return { success: true, data: asset, message: 'Submitted for approval (Phase 1 complete)' };
  }

  // --- Phase 2: Legal verification + SPV ---
  @Post('assets/:id/verify-legal')
  @UseGuards(JwtAuthGuard)
  async verifyLegal(@Param('id') id: string, @Body() body: { documents_verified?: boolean; spv_name?: string; notes?: string }) {
    const asset = await this.service.verifyLegal(id, body);
    return { success: true, data: asset, message: 'Legal verification completed (Phase 2)' };
  }

  // --- Phase 3: CMA compliance review + token config ---
  @Post('assets/:id/cma-review')
  @UseGuards(JwtAuthGuard)
  async cmaReview(@Param('id') id: string, @Body() body: { cma_reference?: string; valuer_name?: string; notes?: string }) {
    const asset = await this.service.completeCmaReview(id, body);
    return { success: true, data: asset, message: 'CMA review completed (Phase 3)' };
  }

  // --- Phase 4: Deploy smart contract ---
  @Post('assets/:id/deploy-contract')
  @UseGuards(JwtAuthGuard)
  async deployContract(@Param('id') id: string) {
    const asset = await this.service.deployContract(id);
    return { success: true, data: asset, message: 'ERC-3643 contract deployed (Phase 4)' };
  }

  // --- Phase 5: Mint tokens to escrow ---
  @Post('assets/:id/mint-tokens')
  @UseGuards(JwtAuthGuard)
  async mintTokens(@Param('id') id: string) {
    const asset = await this.service.mintTokens(id);
    return { success: true, data: asset, message: 'Tokens minted to escrow (Phase 5) — offering ACTIVE' };
  }

  // --- Convenience: one-click approve (phases 2-5) ---
  @Post('assets/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approve(@Param('id') id: string) {
    const asset = await this.service.approveAsset(id);
    return { success: true, data: asset, message: 'Asset approved — all phases completed' };
  }

  // --- Reject ---
  @Post('assets/:id/reject')
  @UseGuards(JwtAuthGuard)
  async reject(@Param('id') id: string, @Body() body: { notes?: string }) {
    const asset = await this.service.rejectAsset(id, body.notes);
    return { success: true, data: asset, message: 'Asset rejected — sent back for corrections' };
  }

  // --- Offerings (ACTIVE only, for investors) ---
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

  // --- Phase 6: Invest in primary offering ---
  @Post('offerings/:id/invest')
  @UseGuards(JwtAuthGuard)
  async invest(@Param('id') id: string, @Body() dto: InvestDto, @CurrentUser() user: any) {
    const result = await this.service.invest(id, dto.wallet_id, user.customer_id || user.id, dto.amount_kes);
    return { success: true, data: result, message: 'Investment completed (Phase 6)' };
  }

  // --- Holdings ---
  @Get('holdings')
  @UseGuards(JwtAuthGuard)
  async getHoldings(@CurrentUser() user: any) {
    const holdings = await this.service.getHoldings(user.customer_id || user.id);
    return { success: true, data: holdings };
  }
}
