import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Trade } from './entities/trade.entity';
import { TradingPair } from './entities/trading-pair.entity';
import { Asset } from '../wallets/entities/asset.entity';
import { TradingService } from './trading.service';
import { TradingController } from './trading.controller';
import { MatchingEngineService } from './matching-engine.service';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Trade, TradingPair, Asset]),
    WalletsModule,
  ],
  controllers: [TradingController],
  providers: [TradingService, MatchingEngineService],
  exports: [TradingService],
})
export class TradingModule {}
