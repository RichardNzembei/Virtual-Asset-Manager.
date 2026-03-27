import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('customers')
export class CustomersController {
  constructor(private service: CustomersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    const result = await this.service.findAll(page, limit, status);
    return { success: true, data: result.data, meta: { page: result.page, limit: result.limit, total: result.total } };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const customer = await this.service.findOne(id);
    return { success: true, data: customer };
  }

  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    const customer = await this.service.create(dto);
    return { success: true, data: customer };
  }
}
