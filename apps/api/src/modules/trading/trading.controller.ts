import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TradingService } from './trading.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('trading')
export class TradingController {
  constructor(private service: TradingService) {}

  @Get('pairs')
  async getPairs() {
    const pairs = await this.service.getPairs();
    return { success: true, data: pairs };
  }

  @Get('pairs/:pair/orderbook')
  async getOrderBook(@Param('pair') pair: string, @Query('depth') depth = 20) {
    const book = await this.service.getOrderBook(decodeURIComponent(pair), depth);
    return { success: true, data: book };
  }

  @Get('pairs/:pair/ticker')
  async getTicker(@Param('pair') pair: string) {
    const ticker = await this.service.getTicker(decodeURIComponent(pair));
    return { success: true, data: ticker };
  }

  @Get('pairs/:pair/trades')
  async getRecentTrades(@Param('pair') pair: string, @Query('limit') limit = 20) {
    const trades = await this.service.getRecentTrades(decodeURIComponent(pair), limit);
    return { success: true, data: trades };
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  async placeOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    const order = await this.service.placeOrder({
      wallet_id: dto.wallet_id,
      customer_id: user.customer_id || user.id,
      pair: dto.pair,
      side: dto.side,
      type: dto.type,
      quantity: dto.quantity,
      price: dto.price,
      time_in_force: dto.time_in_force,
      client_order_id: dto.client_order_id,
    });
    return { success: true, data: order };
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  async getOrder(@Param('id') id: string) {
    const order = await this.service.getOrder(id);
    return { success: true, data: order };
  }

  @Delete('orders/:id')
  @UseGuards(JwtAuthGuard)
  async cancelOrder(@Param('id') id: string, @CurrentUser() user: any) {
    const order = await this.service.cancelOrder(id, user.customer_id || user.id);
    return { success: true, data: order, message: 'Order cancelled' };
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  async listOrders(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    const result = await this.service.listOrders(user.customer_id || user.id, page, limit, status);
    return { success: true, data: result.data, meta: { page, limit, total: result.total } };
  }
}
