import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';

export interface VerificationRecord {
  assetId: string;
  phase: 'LEGAL' | 'FINANCIAL' | 'COMPLIANCE';
  approved: boolean;
  verifierAddress: string;
  verifierRole: string;
  timestamp: number;
  docHash: string;
  notes: string;
  txHash: string;
  blockNumber: number;
}

export interface OnChainAsset {
  assetId: string;
  status: string;
  verifications: VerificationRecord[];
  contractAddress?: string;
  totalSupply?: string;
}

@Injectable()
export class BlockchainMockService {
  private readonly logger = new Logger(BlockchainMockService.name);
  private blockNumber = 4_000_000;

  // On-chain state simulation
  private readonly verificationLog: VerificationRecord[] = [];
  private readonly onChainAssets: Map<string, OnChainAsset> = new Map();

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

  // Generate a document hash (SHA-256 fingerprint)
  hashDocument(content: string): string {
    return '0x' + createHash('sha256').update(content).digest('hex');
  }

  // ============================================================
  // VERIFICATION CONTRACT — 3-Phase On-Chain Verification
  // ============================================================

  async submitLegalVerification(params: {
    assetId: string;
    approved: boolean;
    verifierAddress: string;
    notes: string;
    titleDeedHash: string;
  }): Promise<{ txHash: string; blockNumber: number; record: VerificationRecord }> {
    await this.delay(200);
    const record: VerificationRecord = {
      assetId: params.assetId,
      phase: 'LEGAL',
      approved: params.approved,
      verifierAddress: params.verifierAddress,
      verifierRole: 'LEGAL_VERIFIER_ROLE',
      timestamp: Date.now(),
      docHash: params.titleDeedHash,
      notes: params.notes,
      txHash: this.fakeTxHash(),
      blockNumber: this.nextBlock(),
    };
    this.verificationLog.push(record);
    this.ensureAsset(params.assetId);
    this.onChainAssets.get(params.assetId)!.verifications.push(record);
    this.logger.log(`[BESU] LegalVerified(${params.assetId.slice(0, 8)}..., approved=${params.approved}, verifier=${params.verifierAddress.slice(0, 10)}..., docHash=${params.titleDeedHash.slice(0, 16)}...)`);
    return { txHash: record.txHash, blockNumber: record.blockNumber, record };
  }

  async submitFinancialAudit(params: {
    assetId: string;
    approved: boolean;
    verifierAddress: string;
    confirmedValue: string;
    confirmedYield: string;
    auditReportHash: string;
  }): Promise<{ txHash: string; blockNumber: number; record: VerificationRecord }> {
    await this.delay(200);
    const record: VerificationRecord = {
      assetId: params.assetId,
      phase: 'FINANCIAL',
      approved: params.approved,
      verifierAddress: params.verifierAddress,
      verifierRole: 'FINANCIAL_AUDITOR_ROLE',
      timestamp: Date.now(),
      docHash: params.auditReportHash,
      notes: `Confirmed value: ${params.confirmedValue}, yield: ${params.confirmedYield}`,
      txHash: this.fakeTxHash(),
      blockNumber: this.nextBlock(),
    };
    this.verificationLog.push(record);
    this.ensureAsset(params.assetId);
    this.onChainAssets.get(params.assetId)!.verifications.push(record);
    this.logger.log(`[BESU] FinancialAudited(${params.assetId.slice(0, 8)}..., value=${params.confirmedValue}, yield=${params.confirmedYield})`);
    return { txHash: record.txHash, blockNumber: record.blockNumber, record };
  }

  async submitComplianceCheck(params: {
    assetId: string;
    approved: boolean;
    verifierAddress: string;
    kycRef: string;
    jurisdictions: string;
  }): Promise<{ txHash: string; blockNumber: number; record: VerificationRecord }> {
    await this.delay(200);
    const record: VerificationRecord = {
      assetId: params.assetId,
      phase: 'COMPLIANCE',
      approved: params.approved,
      verifierAddress: params.verifierAddress,
      verifierRole: 'COMPLIANCE_OFFICER_ROLE',
      timestamp: Date.now(),
      docHash: this.hashDocument(params.kycRef),
      notes: `KYC: ${params.kycRef}, Jurisdictions: ${params.jurisdictions}`,
      txHash: this.fakeTxHash(),
      blockNumber: this.nextBlock(),
    };
    this.verificationLog.push(record);
    this.ensureAsset(params.assetId);
    this.onChainAssets.get(params.assetId)!.verifications.push(record);
    this.logger.log(`[BESU] ComplianceChecked(${params.assetId.slice(0, 8)}..., kycRef=${params.kycRef})`);
    return { txHash: record.txHash, blockNumber: record.blockNumber, record };
  }

  // Multi-sig finalization gate: all 3 phases must pass
  async finalizeAssetVerification(assetId: string): Promise<{
    verified: boolean; txHash: string; blockNumber: number; phases: { legal: boolean; financial: boolean; compliance: boolean };
  }> {
    await this.delay(200);
    const asset = this.onChainAssets.get(assetId);
    const phases = {
      legal: asset?.verifications.some(v => v.phase === 'LEGAL' && v.approved) || false,
      financial: asset?.verifications.some(v => v.phase === 'FINANCIAL' && v.approved) || false,
      compliance: asset?.verifications.some(v => v.phase === 'COMPLIANCE' && v.approved) || false,
    };
    const verified = phases.legal && phases.financial && phases.compliance;
    if (verified && asset) {
      asset.status = 'VERIFIED';
    }
    const txHash = this.fakeTxHash();
    const blockNumber = this.nextBlock();
    this.logger.log(`[BESU] FinalizeAsset(${assetId.slice(0, 8)}..., verified=${verified}, legal=${phases.legal}, financial=${phases.financial}, compliance=${phases.compliance})`);
    return { verified, txHash, blockNumber, phases };
  }

  // Query on-chain verification state
  getVerificationRecords(assetId: string): VerificationRecord[] {
    return this.verificationLog.filter(r => r.assetId === assetId);
  }

  getOnChainAsset(assetId: string): OnChainAsset | undefined {
    return this.onChainAssets.get(assetId);
  }

  // Get full blockchain log (for admin dashboard)
  getBlockchainLog(limit = 50): VerificationRecord[] {
    return this.verificationLog.slice(-limit).reverse();
  }

  // ============================================================
  // TOKEN OPERATIONS
  // ============================================================

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

  // ============================================================
  // AML ON-CHAIN LOGGING
  // ============================================================

  async logAmlCheck(params: {
    userId: string; passed: boolean; riskScore: number; checkType: string;
  }): Promise<{ txHash: string; blockNumber: number }> {
    await this.delay(100);
    const txHash = this.fakeTxHash();
    const blockNumber = this.nextBlock();
    this.logger.log(`[BESU] AMLCheck(${params.userId.slice(0, 8)}..., passed=${params.passed}, risk=${params.riskScore}, type=${params.checkType})`);
    return { txHash, blockNumber };
  }

  private ensureAsset(assetId: string) {
    if (!this.onChainAssets.has(assetId)) {
      this.onChainAssets.set(assetId, {
        assetId,
        status: 'PENDING',
        verifications: [],
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
