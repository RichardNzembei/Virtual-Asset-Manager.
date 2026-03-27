import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class CustodyMockService {
  private readonly logger = new Logger(CustodyMockService.name);

  async initiateMpcKeyCeremony(customerId: string): Promise<{
    keyId: string;
    deviceShareCreated: boolean;
    serverShareCreated: boolean;
    backupShareCreated: boolean;
  }> {
    await this.delay(300);
    const keyId = `mpc-${createHash('sha256').update(customerId).digest('hex').slice(0, 16)}`;
    this.logger.log(`MPC key ceremony completed for ${customerId.slice(0, 8)}... → keyId: ${keyId}`);
    return {
      keyId,
      deviceShareCreated: true,
      serverShareCreated: true,
      backupShareCreated: true,
    };
  }

  deriveAddress(keyId: string, chain: string): string {
    const hash = createHash('sha256').update(`${keyId}:${chain}`).digest('hex');
    switch (chain) {
      case 'BTC':
        return `bc1q${hash.slice(0, 38)}`;
      case 'ETH':
      case 'TRAMIA':
        return `0x${hash.slice(0, 40).replace(/^0+/, '') || hash.slice(0, 40)}`;
      default:
        return `0x${hash.slice(0, 40)}`;
    }
  }

  deriveDerivationPath(chain: string, index: number = 0): string {
    switch (chain) {
      case 'BTC': return `m/84'/0'/0'/0/${index}`;
      case 'ETH': return `m/44'/60'/0'/0/${index}`;
      case 'TRAMIA': return `m/44'/9999'/0'/0/${index}`;
      default: return `m/44'/0'/0'/0/${index}`;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
