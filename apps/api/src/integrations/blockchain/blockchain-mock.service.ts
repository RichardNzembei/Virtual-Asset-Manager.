import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class BlockchainMockService {
  private readonly logger = new Logger(BlockchainMockService.name);
  private blockNumber = 4_000_000;

  private nextBlock(): number {
    return ++this.blockNumber;
  }

  private fakeTxHash(): string {
    return '0x' + randomBytes(32).toString('hex');
  }

  private fakeAddress(seed: string): string {
    const hash = createHash('sha256').update(seed + Date.now()).digest('hex');
    return '0x' + hash.slice(0, 40);
  }

  async mintTokens(params: { tokenAddress: string; recipient: string; amount: string }): Promise<{
    txHash: string; blockNumber: number; status: string;
  }> {
    await this.delay(200);
    const result = { txHash: this.fakeTxHash(), blockNumber: this.nextBlock(), status: 'confirmed' };
    this.logger.log(`MINT ${params.amount} tokens to ${params.recipient.slice(0, 10)}... → block ${result.blockNumber}`);
    return result;
  }

  async burnTokens(params: { tokenAddress: string; from: string; amount: string }): Promise<{
    txHash: string; blockNumber: number; status: string;
  }> {
    await this.delay(200);
    const result = { txHash: this.fakeTxHash(), blockNumber: this.nextBlock(), status: 'confirmed' };
    this.logger.log(`BURN ${params.amount} tokens from ${params.from.slice(0, 10)}... → block ${result.blockNumber}`);
    return result;
  }

  async transfer(params: { tokenAddress: string; from: string; to: string; amount: string }): Promise<{
    txHash: string; blockNumber: number; gasUsed: string;
  }> {
    await this.delay(300);
    const result = { txHash: this.fakeTxHash(), blockNumber: this.nextBlock(), gasUsed: '21000' };
    this.logger.log(`TRANSFER ${params.amount} from ${params.from.slice(0, 10)}... → ${params.to.slice(0, 10)}...`);
    return result;
  }

  async deployToken(params: { name: string; symbol: string; totalSupply: string }): Promise<{
    contractAddress: string; deployTxHash: string; blockNumber: number;
  }> {
    await this.delay(500);
    const result = {
      contractAddress: this.fakeAddress(params.name),
      deployTxHash: this.fakeTxHash(),
      blockNumber: this.nextBlock(),
    };
    this.logger.log(`DEPLOY ${params.symbol} contract at ${result.contractAddress.slice(0, 14)}...`);
    return result;
  }

  async registerIdentity(params: { address: string; identityHash: string }): Promise<{
    txHash: string; blockNumber: number;
  }> {
    await this.delay(200);
    return { txHash: this.fakeTxHash(), blockNumber: this.nextBlock() };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
