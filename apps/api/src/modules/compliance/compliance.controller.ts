import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { TransactionMonitorService } from './transaction-monitor.service';
import { CheckTransactionDto } from './dto/check-transaction.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(
    private service: ComplianceService,
    private monitorService: TransactionMonitorService,
  ) {}

  @Post('transactions/check')
  async checkTransaction(@Body() dto: CheckTransactionDto) {
    const result = await this.monitorService.checkTransaction(dto.customer_id, dto.transaction_type, dto.amount);
    return { success: true, data: result };
  }

  @Get('alerts')
  async listAlerts(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
  ) {
    const result = await this.service.listAlerts(page, limit, status, severity);
    return { success: true, data: result.data, meta: { page, limit, total: result.total } };
  }

  @Get('alerts/stats')
  async getAlertStats() {
    const stats = await this.service.getAlertStats();
    return { success: true, data: stats };
  }

  @Get('alerts/:id')
  async getAlert(@Param('id') id: string) {
    const alert = await this.service.getAlert(id);
    return { success: true, data: alert };
  }

  @Put('alerts/:id')
  async updateAlert(@Param('id') id: string, @Body() dto: UpdateAlertDto, @CurrentUser() user: any) {
    const alert = await this.service.updateAlert(id, {
      ...dto,
      resolved_by: dto.status === 'RESOLVED' || dto.status === 'FALSE_POSITIVE' ? user.id : undefined,
    });
    return { success: true, data: alert };
  }

  @Get('kyc/:customerId')
  async getKycRecords(@Param('customerId') customerId: string) {
    const records = await this.service.getKycRecords(customerId);
    return { success: true, data: records };
  }

  @Post('kyc/:customerId/review')
  async reviewKyc(
    @Param('customerId') customerId: string,
    @Body() body: { kyc_level: number; status: string },
    @CurrentUser() user: any,
  ) {
    const result = await this.service.reviewKyc(customerId, {
      ...body,
      verifier: user.id,
    });
    return { success: true, data: result };
  }

  @Post('reports/generate')
  async generateReport(@Body() body: { type: string; start_date: string; end_date: string }) {
    const report = await this.service.generateReport(body.type, body.start_date, body.end_date);
    return { success: true, data: report };
  }
}
