import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenizedAsset } from './entities/tokenized-asset.entity';
import { RealEstateAsset } from './entities/real-estate-asset.entity';
import { TokenHolding } from './entities/token-holding.entity';
import { Investment } from './entities/investment.entity';
import { Issuer } from './entities/issuer.entity';
import { Asset } from '../wallets/entities/asset.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletsService } from '../wallets/wallets.service';
import { BlockchainMockService } from '../../integrations/blockchain/blockchain-mock.service';

@Injectable()
export class TokenizationService {
  private readonly logger = new Logger(TokenizationService.name);

  constructor(
    @InjectRepository(TokenizedAsset) private assetRepo: Repository<TokenizedAsset>,
    @InjectRepository(RealEstateAsset) private realEstateRepo: Repository<RealEstateAsset>,
    @InjectRepository(TokenHolding) private holdingRepo: Repository<TokenHolding>,
    @InjectRepository(Investment) private investmentRepo: Repository<Investment>,
    @InjectRepository(Issuer) private issuerRepo: Repository<Issuer>,
    @InjectRepository(Asset) private baseAssetRepo: Repository<Asset>,
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    private walletsService: WalletsService,
    private blockchainService: BlockchainMockService,
  ) {}

  // ============================================================
  // PHASE 1: Asset Submission (DRAFT → PENDING_APPROVAL)
  // ============================================================

  async submitAsset(issuerId: string, params: any) {
    const asset = this.assetRepo.create({
      asset_type: params.asset_type || 'REAL_ESTATE',
      issuer_id: issuerId,
      name: params.name,
      description: params.description,
      token_symbol: params.token_symbol,
      token_name: params.token_name,
      total_supply: params.total_supply?.toString(),
      token_price_kes: (params.token_price_kes || 100).toString(),
      asset_value_kes: params.asset_value_kes?.toString(),
      min_investment_kes: (params.min_investment_kes || 100).toString(),
      expected_yield: params.expected_yield?.toString(),
      distribution_frequency: params.distribution_frequency || 'QUARTERLY',
      lock_up_days: params.lock_up_days || 180,
      status: 'DRAFT',
      compliance_status: 'PENDING',
      legal_status: 'PENDING',
      spv_status: 'PENDING',
    });
    const saved = await this.assetRepo.save(asset);

    if (params.asset_type === 'REAL_ESTATE' && params.property_type) {
      await this.realEstateRepo.save(
        this.realEstateRepo.create({
          tokenized_asset_id: saved.id,
          property_type: params.property_type,
          address: params.property_address,
          city: params.city,
          county: params.county,
          title_number: params.title_number,
          current_valuation_kes: params.asset_value_kes?.toString(),
          rental_income_monthly_kes: params.rental_income_monthly_kes?.toString(),
          occupancy_rate: params.occupancy_rate?.toString(),
          spv_name: params.spv_name,
        }),
      );
    }

    this.logger.log(`Phase 1: Asset "${saved.name}" submitted as DRAFT (${saved.token_symbol})`);
    return saved;
  }

  async submitForApproval(id: string) {
    const asset = await this.findOne(id);
    if (asset.status !== 'DRAFT') throw new BadRequestException('Asset must be in DRAFT status');
    asset.status = 'PENDING_APPROVAL';
    this.logger.log(`Phase 1: Asset "${asset.name}" submitted for approval`);
    return this.assetRepo.save(asset);
  }

  // ============================================================
  // PHASE 2: Legal Verification + SPV Structuring
  // (PENDING_APPROVAL → LEGAL_REVIEW)
  // ============================================================

  async verifyLegal(id: string, params?: { documents_verified?: boolean; spv_name?: string; notes?: string }) {
    const asset = await this.findOne(id);
    if (asset.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Asset must be in PENDING_APPROVAL status for legal verification');
    }

    // Generate document hash (title deed fingerprint)
    const titleDeedHash = this.blockchainService.hashDocument(
      `title-deed:${asset.token_symbol}:${params?.notes || 'verified'}:${Date.now()}`,
    );

    // Record on-chain: legal verifier signs the verification contract
    const verifierAddress = this.blockchainService.hashDocument(`legal-verifier-${Date.now()}`).slice(0, 42);
    const onChainResult = await this.blockchainService.submitLegalVerification({
      assetId: id,
      approved: true,
      verifierAddress,
      notes: params?.notes || 'Title deed verified, no encumbrances',
      titleDeedHash,
    });

    asset.legal_status = 'VERIFIED';
    asset.spv_status = params?.spv_name ? 'STRUCTURED' : 'STRUCTURED';
    asset.status = 'LEGAL_REVIEW';
    asset.metadata = {
      ...(asset.metadata || {}),
      legal_notes: params?.notes,
      legal_tx_hash: onChainResult.txHash,
      legal_block: onChainResult.blockNumber,
      title_deed_hash: titleDeedHash,
      legal_verifier_address: verifierAddress,
    };

    // Update SPV info on real estate detail if applicable
    if (params?.spv_name && asset.asset_type === 'REAL_ESTATE') {
      const reAsset = await this.realEstateRepo.findOne({ where: { tokenized_asset_id: id } });
      if (reAsset) {
        reAsset.spv_name = params.spv_name;
        await this.realEstateRepo.save(reAsset);
      }
    }

    this.logger.log(`Phase 2: Legal verification on-chain at block ${onChainResult.blockNumber}, docHash=${titleDeedHash.slice(0, 16)}...`);
    return this.assetRepo.save(asset);
  }

  // ============================================================
  // PHASE 3: CMA Compliance Review + Token Configuration
  // (LEGAL_REVIEW → CMA_APPROVED)
  // ============================================================

  async completeCmaReview(id: string, params?: { cma_reference?: string; valuer_name?: string; notes?: string }) {
    const asset = await this.findOne(id);
    if (asset.status !== 'LEGAL_REVIEW') {
      throw new BadRequestException('Asset must be in LEGAL_REVIEW status for CMA review');
    }

    // CMA compliance approval
    asset.cma_reference = params?.cma_reference || `CMA-2026-TOK-${String(Date.now()).slice(-5)}`;
    asset.compliance_status = 'APPROVED';

    // Token configuration: calculate supply from asset value / token price
    const tokenPrice = parseFloat(asset.token_price_kes) || 100;
    const assetValue = parseFloat(asset.asset_value_kes) || 0;
    if (assetValue > 0) {
      const totalSupply = Math.floor(assetValue / tokenPrice);
      asset.total_supply = totalSupply.toString();
      asset.tokens_remaining = totalSupply.toString();
    }

    // Valuation data
    if (params?.valuer_name) {
      asset.valuer_name = params.valuer_name;
      asset.valuation_date = new Date();
    }

    // On-chain: Financial audit (valuation) signed by auditor
    const auditorAddress = this.blockchainService.hashDocument(`financial-auditor-${Date.now()}`).slice(0, 42);
    const auditHash = this.blockchainService.hashDocument(`audit-report:${asset.token_symbol}:${assetValue}:${Date.now()}`);
    const auditResult = await this.blockchainService.submitFinancialAudit({
      assetId: id,
      approved: true,
      verifierAddress: auditorAddress,
      confirmedValue: assetValue.toString(),
      confirmedYield: (parseFloat(asset.expected_yield || '0') * 100).toString(),
      auditReportHash: auditHash,
    });

    // On-chain: Compliance check signed by compliance officer
    const complianceAddress = this.blockchainService.hashDocument(`compliance-officer-${Date.now()}`).slice(0, 42);
    const complianceResult = await this.blockchainService.submitComplianceCheck({
      assetId: id,
      approved: true,
      verifierAddress: complianceAddress,
      kycRef: asset.cma_reference,
      jurisdictions: 'KE,UG,TZ,RW', // East Africa
    });

    // On-chain: Finalize — all 3 phases must pass (multi-sig gate)
    const finalizeResult = await this.blockchainService.finalizeAssetVerification(id);
    if (!finalizeResult.verified) {
      throw new BadRequestException('On-chain verification failed — not all 3 phases approved');
    }

    asset.status = 'CMA_APPROVED';

    asset.metadata = {
      ...(asset.metadata || {}),
      cma_notes: params?.notes,
      audit_tx_hash: auditResult.txHash,
      audit_block: auditResult.blockNumber,
      audit_report_hash: auditHash,
      auditor_address: auditorAddress,
      compliance_tx_hash: complianceResult.txHash,
      compliance_block: complianceResult.blockNumber,
      compliance_officer_address: complianceAddress,
      finalize_tx_hash: finalizeResult.txHash,
      finalize_block: finalizeResult.blockNumber,
      all_phases_passed: finalizeResult.phases,
    };

    if (params?.notes) {
      asset.metadata.cma_notes = params.notes;
    }

    this.logger.log(`Phase 3: CMA approved for "${asset.name}" — ref ${asset.cma_reference}, ${asset.total_supply} tokens configured at KES ${tokenPrice}`);
    return this.assetRepo.save(asset);
  }

  // ============================================================
  // PHASE 4: Smart Contract Deployment (ERC-3643)
  // (CMA_APPROVED → CONTRACT_DEPLOYED)
  // ============================================================

  async deployContract(id: string) {
    const asset = await this.findOne(id);
    if (asset.status !== 'CMA_APPROVED') {
      throw new BadRequestException('Asset must be in CMA_APPROVED status for contract deployment');
    }

    // Deploy ERC-3643 token contract via AssetFactory
    const deployment = await this.blockchainService.deployToken({
      name: asset.token_name,
      symbol: asset.token_symbol,
      totalSupply: asset.total_supply || '0',
    });

    asset.token_contract_address = deployment.contractAddress;
    asset.status = 'CONTRACT_DEPLOYED';

    // Register as asset in assets table (not tradeable until secondary market)
    const existing = await this.baseAssetRepo.findOne({ where: { symbol: asset.token_symbol } });
    if (!existing) {
      await this.baseAssetRepo.save(
        this.baseAssetRepo.create({
          symbol: asset.token_symbol,
          name: asset.token_name,
          asset_type: 'SECURITY_TOKEN',
          chain: 'TRAMIA',
          contract_address: deployment.contractAddress,
          decimals: 18,
          is_tradeable: false,
          status: 'ACTIVE',
        }),
      );
    }

    this.logger.log(`Phase 4: ERC-3643 contract deployed for "${asset.name}" at ${deployment.contractAddress}`);
    return this.assetRepo.save(asset);
  }

  // ============================================================
  // PHASE 5: Token Minting (to escrow wallet)
  // (CONTRACT_DEPLOYED → ACTIVE)
  // ============================================================

  async mintTokens(id: string) {
    const asset = await this.findOne(id);
    if (asset.status !== 'CONTRACT_DEPLOYED') {
      throw new BadRequestException('Asset must be in CONTRACT_DEPLOYED status for minting');
    }

    // Find system escrow wallet
    const escrowWallet = await this.walletRepo.findOne({ where: { wallet_type: 'ESCROW' } });
    if (!escrowWallet) throw new BadRequestException('System escrow wallet not found');

    // Get escrow wallet address
    asset.escrow_wallet_id = escrowWallet.id;

    // Mint total supply to escrow
    const mintResult = await this.blockchainService.mintTokens({
      tokenAddress: asset.token_contract_address || '0x0',
      recipient: escrowWallet.id,
      amount: asset.total_supply || '0',
    });

    asset.tokens_remaining = asset.total_supply;
    asset.tokens_outstanding = '0';
    asset.offering_start = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    asset.offering_end = endDate;
    asset.status = 'ACTIVE';

    this.logger.log(`Phase 5: Minted ${asset.total_supply} ${asset.token_symbol} tokens to escrow wallet — offering ACTIVE`);
    return this.assetRepo.save(asset);
  }

  // ============================================================
  // CONVENIENCE: One-click approve (runs phases 2→3→4→5)
  // ============================================================

  async approveAsset(id: string) {
    let asset = await this.findOne(id);

    if (asset.status === 'PENDING_APPROVAL') {
      asset = await this.verifyLegal(id, { spv_name: 'Auto SPV Ltd' });
    }
    if (asset.status === 'LEGAL_REVIEW') {
      asset = await this.completeCmaReview(id, { valuer_name: 'Knight Frank Kenya' });
    }
    if (asset.status === 'CMA_APPROVED') {
      asset = await this.deployContract(id);
    }
    if (asset.status === 'CONTRACT_DEPLOYED') {
      asset = await this.mintTokens(id);
    }

    this.logger.log(`One-click approve completed for "${asset.name}" — now ACTIVE`);
    return asset;
  }

  // ============================================================
  // REJECT: Send back for corrections
  // ============================================================

  async rejectAsset(id: string, notes?: string) {
    const asset = await this.findOne(id);
    asset.status = 'PENDING_APPROVAL'; // Back to pending, not DRAFT — issuer can resubmit docs
    asset.compliance_status = 'REJECTED';
    if (notes) {
      asset.metadata = { ...(asset.metadata || {}), rejection_notes: notes };
    }
    this.logger.log(`Asset "${asset.name}" rejected — sent back to PENDING_APPROVAL`);
    return this.assetRepo.save(asset);
  }

  // ============================================================
  // PHASE 6: Primary Offering — Investor Subscription
  // ============================================================

  async invest(assetId: string, walletId: string, customerId: string, amountKes: number) {
    const asset = await this.findOne(assetId);
    if (asset.status !== 'ACTIVE') throw new BadRequestException('Offering not active');

    // Check offering hasn't expired
    if (asset.offering_end && new Date() > new Date(asset.offering_end)) {
      throw new BadRequestException('Offering period has ended');
    }

    if (amountKes < parseFloat(asset.min_investment_kes)) {
      throw new BadRequestException(`Minimum investment is KES ${asset.min_investment_kes}`);
    }

    const tokenPrice = parseFloat(asset.token_price_kes);
    const tokenAmount = amountKes / tokenPrice;

    // Check tokens remaining in escrow
    const remaining = parseFloat(asset.tokens_remaining || '0');
    if (tokenAmount > remaining) {
      throw new BadRequestException(`Only ${remaining} tokens remaining. You requested ${tokenAmount}`);
    }

    // Debit tKES from investor
    const tKES = await this.baseAssetRepo.findOne({ where: { symbol: 'tKES' } });
    if (tKES) {
      await this.walletsService.updateBalance(
        walletId, tKES.id, 'available', -amountKes, 'INVESTMENT', assetId,
      );
    }

    // Create investment record
    const investment = this.investmentRepo.create({
      asset_id: assetId,
      wallet_id: walletId,
      customer_id: customerId,
      amount_kes: amountKes.toString(),
      token_amount: tokenAmount.toString(),
      token_price: tokenPrice.toString(),
      status: 'COMPLETED',
      completed_at: new Date(),
    });

    // Blockchain transfer from escrow to investor
    const txResult = await this.blockchainService.transfer({
      tokenAddress: asset.token_contract_address || '0x0',
      from: asset.escrow_wallet_id || 'escrow',
      to: walletId,
      amount: tokenAmount.toString(),
    });
    investment.blockchain_tx_hash = txResult.txHash;
    await this.investmentRepo.save(investment);

    // Update or create token holding
    let holding = await this.holdingRepo.findOne({
      where: { asset_id: assetId, wallet_id: walletId },
    });
    if (holding) {
      holding.balance = (parseFloat(holding.balance) + tokenAmount).toString();
    } else {
      const lockUpDate = new Date();
      lockUpDate.setDate(lockUpDate.getDate() + (asset.lock_up_days || 180));
      holding = this.holdingRepo.create({
        asset_id: assetId,
        wallet_id: walletId,
        customer_id: customerId,
        balance: tokenAmount.toString(),
        locked_balance: '0',
        acquisition_price_avg: tokenPrice.toString(),
        lock_up_until: lockUpDate,
      });
    }
    await this.holdingRepo.save(holding);

    // Update asset counters
    asset.tokens_outstanding = (parseFloat(asset.tokens_outstanding || '0') + tokenAmount).toString();
    asset.tokens_remaining = (remaining - tokenAmount).toString();
    asset.current_investors = (asset.current_investors || 0) + 1;
    asset.total_raised_kes = (parseFloat(asset.total_raised_kes || '0') + amountKes).toString();
    await this.assetRepo.save(asset);

    this.logger.log(`Phase 6: ${customerId.slice(0, 8)}... invested KES ${amountKes} → ${tokenAmount} ${asset.token_symbol} tokens`);
    return { investment, holding };
  }

  // ============================================================
  // QUERIES
  // ============================================================

  async findOne(id: string): Promise<TokenizedAsset> {
    const a = await this.assetRepo.findOne({ where: { id }, relations: ['issuer'] });
    if (!a) throw new NotFoundException('Tokenized asset not found');
    return a;
  }

  async getAssetWithDetails(id: string) {
    const asset = await this.findOne(id);
    let details = null;
    if (asset.asset_type === 'REAL_ESTATE') {
      details = await this.realEstateRepo.findOne({ where: { tokenized_asset_id: id } });
    }
    return { ...asset, property_details: details };
  }

  async listOfferings(page = 1, limit = 20) {
    const [data, total] = await this.assetRepo.findAndCount({
      where: { status: 'ACTIVE' },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['issuer'],
    });
    return { data, total, page, limit };
  }

  async listAll(page = 1, limit = 20) {
    const [data, total] = await this.assetRepo.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['issuer'],
    });
    return { data, total, page, limit };
  }

  async getHoldings(customerId: string) {
    return this.holdingRepo.find({
      where: { customer_id: customerId },
      relations: ['tokenized_asset'],
    });
  }

  async getPendingApprovals() {
    return this.assetRepo.find({
      where: { status: 'PENDING_APPROVAL' },
      relations: ['issuer'],
      order: { created_at: 'ASC' },
    });
  }
}
