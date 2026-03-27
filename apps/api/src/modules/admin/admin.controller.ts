import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    const data = await this.service.getDashboard();
    return { success: true, data };
  }
}
