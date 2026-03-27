import { Module, Global } from '@nestjs/common';
import { BlockchainMockService } from './blockchain/blockchain-mock.service';
import { T24MockService } from './core-banking/t24-mock.service';
import { CustodyMockService } from './custody/custody-mock.service';

@Global()
@Module({
  providers: [BlockchainMockService, T24MockService, CustodyMockService],
  exports: [BlockchainMockService, T24MockService, CustodyMockService],
})
export class IntegrationsModule {}
