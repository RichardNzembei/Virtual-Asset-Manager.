import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Order } from './entities/order.entity';
import { Trade } from './entities/trade.entity';
import { TradingPair } from './entities/trading-pair.entity';
import { MatchingEngineService } from './matching-engine.service';
import { WalletsService } from '../wallets/wallets.service';
import { Asset } from '../wallets/entities/asset.entity';

@Injectable()
export class TradingService implements OnModuleInit {
  private readonly logger = new Logger(TradingService.name);
  private lastPrices: Map<string, number> = new Map();

  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Trade) private tradeRepo: Repository<Trade>,
    @InjectRepository(TradingPair) private pairRepo: Repository<TradingPair>,
    @InjectRepository(Asset) private assetRepo: Repository<Asset>,
    private matchingEngine: MatchingEngineService,
    private walletsService: WalletsService,
  ) {}

  async onModuleInit() {
    await this.hydrateOrderBook();
  }

  private async hydrateOrderBook() {
    const openOrders = await this.orderRepo.find({
      where: { status: In(['OPEN', 'PARTIALLY_FILLED']) },
      relations: ['pair'],
    });

    const pairs = await this.pairRepo.find();
    const pairMap = new Map(pairs.map((p) => [p.id, p.symbol]));

    let bidCount = 0;
    let askCount = 0;

    for (const order of openOrders) {
      const pairSymbol = pairMap.get(order.pair_id);
      if (!pairSymbol) continue;

      this.matchingEngine.addOrderWithoutMatching(pairSymbol, {
        orderId: order.id,
        price: parseFloat(order.price),
        quantity: parseFloat(order.quantity),
        remainingQuantity: parseFloat(order.remaining_quantity),
        side: order.side,
        walletId: order.wallet_id,
        customerId: order.customer_id,
        timestamp: order.created_at,
      });

      if (order.side === 'BUY') bidCount++;
      else askCount++;
    }

    // Set default last prices
    this.lastPrices.set('BTC/tKES', 13000000);
    this.lastPrices.set('ETH/tKES', 450000);
    this.lastPrices.set('BTC/USDC', 100000);
    this.lastPrices.set('USDC/tKES', 129);

    // Override with most recent trade prices if available
    for (const pair of pairs) {
      const lastTrade = await this.tradeRepo.findOne({
        where: { pair_id: pair.id },
        order: { executed_at: 'DESC' },
      });
      if (lastTrade) {
        this.lastPrices.set(pair.symbol, parseFloat(lastTrade.price));
      }
    }

    this.logger.log(`Order book hydrated: ${bidCount} bids, ${askCount} asks across ${pairMap.size} pairs`);
  }

  async getPairs() {
    return this.pairRepo.find({ where: { status: 'ACTIVE' }, relations: ['base_asset', 'quote_asset'] });
  }

  async getOrderBook(pairSymbol: string, depth = 20) {
    const book = this.matchingEngine.getOrderBook(pairSymbol, depth);
    return {
      pair: pairSymbol,
      ...book,
      last_price: this.lastPrices.get(pairSymbol) || null,
    };
  }

  async getTicker(pairSymbol: string) {
    const lastPrice = this.lastPrices.get(pairSymbol) || 13000000;
    const book = this.matchingEngine.getOrderBook(pairSymbol, 1);
    return {
      pair: pairSymbol,
      last_price: lastPrice,
      best_bid: book.bids[0]?.price || null,
      best_ask: book.asks[0]?.price || null,
      spread: book.spread,
      volume_24h: '0.5',
      change_24h: '+0.5%',
    };
  }

  async placeOrder(params: {
    wallet_id: string;
    customer_id: string;
    pair: string;
    side: string;
    type: string;
    quantity: number;
    price?: number;
    time_in_force?: string;
    client_order_id?: string;
  }) {
    const tradingPair = await this.pairRepo.findOne({
      where: { symbol: params.pair },
      relations: ['base_asset', 'quote_asset'],
    });
    if (!tradingPair) throw new NotFoundException('Trading pair not found');

    if (params.type === 'LIMIT' && !params.price) {
      throw new BadRequestException('Price is required for limit orders');
    }

    const price = params.price || this.lastPrices.get(params.pair) || 13000000;

    // Lock funds
    if (params.side === 'BUY') {
      const totalCost = params.quantity * price;
      await this.walletsService.updateBalance(
        params.wallet_id, tradingPair.quote_asset_id, 'available', -totalCost, 'ORDER_LOCK', uuidv4(),
      );
      await this.walletsService.updateBalance(
        params.wallet_id, tradingPair.quote_asset_id, 'locked', totalCost, 'ORDER_LOCK', uuidv4(),
      );
    } else {
      await this.walletsService.updateBalance(
        params.wallet_id, tradingPair.base_asset_id, 'available', -params.quantity, 'ORDER_LOCK', uuidv4(),
      );
      await this.walletsService.updateBalance(
        params.wallet_id, tradingPair.base_asset_id, 'locked', params.quantity, 'ORDER_LOCK', uuidv4(),
      );
    }

    const order = this.orderRepo.create({
      client_order_id: params.client_order_id,
      wallet_id: params.wallet_id,
      customer_id: params.customer_id,
      pair_id: tradingPair.id,
      order_type: params.type,
      side: params.side,
      time_in_force: params.time_in_force || 'GTC',
      quantity: params.quantity.toString(),
      price: price.toString(),
      filled_quantity: '0',
      remaining_quantity: params.quantity.toString(),
      total_cost: '0',
      fee_amount: '0',
      status: 'OPEN',
    });
    const saved = await this.orderRepo.save(order);

    // Submit to matching engine
    const matches = this.matchingEngine.addOrder(params.pair, {
      orderId: saved.id,
      price,
      quantity: params.quantity,
      remainingQuantity: params.quantity,
      side: params.side,
      walletId: params.wallet_id,
      customerId: params.customer_id,
      timestamp: new Date(),
    });

    // Process matches
    for (const match of matches) {
      await this.settleTrade(tradingPair, match, params.side);
    }

    // Refresh order status
    const updated = await this.orderRepo.findOne({ where: { id: saved.id } });
    return updated || saved;
  }

  private async settleTrade(
    pair: TradingPair,
    match: { makerOrderId: string; takerOrderId: string; price: number; quantity: number; quoteAmount: number },
    takerSide: string,
  ) {
    const makerOrder = await this.orderRepo.findOne({ where: { id: match.makerOrderId } });
    const takerOrder = await this.orderRepo.findOne({ where: { id: match.takerOrderId } });
    if (!makerOrder || !takerOrder) return;

    const makerFee = match.quoteAmount * parseFloat(pair.maker_fee_rate);
    const takerFee = match.quoteAmount * parseFloat(pair.taker_fee_rate);

    // Create trade record
    const trade = this.tradeRepo.create({
      pair_id: pair.id,
      maker_order_id: match.makerOrderId,
      taker_order_id: match.takerOrderId,
      price: match.price.toString(),
      quantity: match.quantity.toString(),
      quote_amount: match.quoteAmount.toString(),
      maker_fee: makerFee.toString(),
      taker_fee: takerFee.toString(),
      side: takerSide,
    });
    await this.tradeRepo.save(trade);

    // Update order states
    const updateOrder = async (order: Order, fillQty: number) => {
      const newFilled = parseFloat(order.filled_quantity) + fillQty;
      const newRemaining = parseFloat(order.quantity) - newFilled;
      order.filled_quantity = newFilled.toString();
      order.remaining_quantity = newRemaining.toString();
      order.status = newRemaining <= 0 ? 'FILLED' : 'PARTIALLY_FILLED';
      if (order.status === 'FILLED') order.filled_at = new Date();
      order.average_fill_price = match.price.toString();
      await this.orderRepo.save(order);
    };

    await updateOrder(makerOrder, match.quantity);
    await updateOrder(takerOrder, match.quantity);

    // Settlement: transfer assets
    if (takerSide === 'BUY') {
      // Taker (buyer): unlock quote, credit base
      await this.walletsService.updateBalance(takerOrder.wallet_id, pair.quote_asset_id, 'locked', -match.quoteAmount, 'TRADE', trade.id);
      await this.walletsService.updateBalance(takerOrder.wallet_id, pair.base_asset_id, 'available', match.quantity, 'TRADE', trade.id);
      // Maker (seller): unlock base, credit quote
      await this.walletsService.updateBalance(makerOrder.wallet_id, pair.base_asset_id, 'locked', -match.quantity, 'TRADE', trade.id);
      await this.walletsService.updateBalance(makerOrder.wallet_id, pair.quote_asset_id, 'available', match.quoteAmount - makerFee, 'TRADE', trade.id);
    } else {
      // Taker (seller): unlock base, credit quote
      await this.walletsService.updateBalance(takerOrder.wallet_id, pair.base_asset_id, 'locked', -match.quantity, 'TRADE', trade.id);
      await this.walletsService.updateBalance(takerOrder.wallet_id, pair.quote_asset_id, 'available', match.quoteAmount - takerFee, 'TRADE', trade.id);
      // Maker (buyer): unlock quote, credit base
      await this.walletsService.updateBalance(makerOrder.wallet_id, pair.quote_asset_id, 'locked', -match.quoteAmount, 'TRADE', trade.id);
      await this.walletsService.updateBalance(makerOrder.wallet_id, pair.base_asset_id, 'available', match.quantity, 'TRADE', trade.id);
    }

    this.lastPrices.set(pair.symbol, match.price);
    this.logger.log(`Trade settled: ${match.quantity} @ ${match.price} on ${pair.symbol}`);
  }

  async cancelOrder(orderId: string, customerId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['pair'] });
    if (!order) throw new NotFoundException('Order not found');
    if (order.customer_id !== customerId) throw new BadRequestException('Not your order');
    if (order.status === 'FILLED' || order.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot cancel ${order.status} order`);
    }

    const pair = await this.pairRepo.findOne({ where: { id: order.pair_id } });
    if (!pair) throw new NotFoundException('Pair not found');

    this.matchingEngine.removeOrder(pair.symbol, order.id, order.side);

    // Unlock remaining funds
    const remaining = parseFloat(order.remaining_quantity);
    if (order.side === 'BUY') {
      const unlockAmount = remaining * parseFloat(order.price);
      await this.walletsService.updateBalance(order.wallet_id, pair.quote_asset_id, 'locked', -unlockAmount, 'ORDER_CANCEL', order.id);
      await this.walletsService.updateBalance(order.wallet_id, pair.quote_asset_id, 'available', unlockAmount, 'ORDER_CANCEL', order.id);
    } else {
      await this.walletsService.updateBalance(order.wallet_id, pair.base_asset_id, 'locked', -remaining, 'ORDER_CANCEL', order.id);
      await this.walletsService.updateBalance(order.wallet_id, pair.base_asset_id, 'available', remaining, 'ORDER_CANCEL', order.id);
    }

    order.status = 'CANCELLED';
    return this.orderRepo.save(order);
  }

  async getOrder(id: string) {
    const o = await this.orderRepo.findOne({ where: { id }, relations: ['pair'] });
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }

  async listOrders(customerId: string, page = 1, limit = 20, status?: string) {
    const where: any = { customer_id: customerId };
    if (status) where.status = status;
    const [data, total] = await this.orderRepo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async getRecentTrades(pairSymbol: string, limit = 20) {
    const pair = await this.pairRepo.findOne({ where: { symbol: pairSymbol } });
    if (!pair) return [];
    return this.tradeRepo.find({
      where: { pair_id: pair.id },
      order: { executed_at: 'DESC' },
      take: limit,
    });
  }
}
