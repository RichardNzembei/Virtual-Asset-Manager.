import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenizedAsset } from './entities/tokenized-asset.entity';
import { RealEstateAsset } from './entities/real-estate-asset.entity';
import { TokenHolding } from './entities/token-holding.entity';
import { Investment } from './entities/investment.entity';
import { Issuer } from './entities/issuer.entity';
import { Asset } from '../wallets/entities/asset.entity';
import { TokenizationService } from './tokenization.service';
import { TokenizationController } from './tokenization.controller';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenizedAsset, RealEstateAsset, TokenHolding, Investment, Issuer, Asset]),
    WalletsModule,
  ],
  controllers: [TokenizationController],
  providers: [TokenizationService],
  exports: [TokenizationService],
})
export class TokenizationModule {}
