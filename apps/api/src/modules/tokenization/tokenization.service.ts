import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenizedAsset } from './entities/tokenized-asset.entity';
import { RealEstateAsset } from './entities/real-estate-asset.entity';
import { TokenHolding } from './entities/token-holding.entity';
import { Investment } from './entities/investment.entity';
import { Issuer } from './entities/issuer.entity';
import { Asset } from '../wallets/entities/asset.entity';
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
    private walletsService: WalletsService,
    private blockchainService: BlockchainMockService,
  ) {}

  async submitAsset(issuerId: string, params: any) {
    const asset = this.assetRepo.create({
      asset_type: params.asset_type || 'REAL_ESTATE',
      issuer_id: issuerId,
      name: params.name,
      description: params.description,
      token_symbol: params.token_symbol,
      token_name: params.token_name,
      total_supply: params.total_supply?.toString(),
      token_price_kes: params.token_price_kes?.toString(),
      asset_value_kes: params.asset_value_kes?.toString(),
      min_investment_kes: (params.min_investment_kes || 100).toString(),
      expected_yield: params.expected_yield?.toString(),
      distribution_frequency: params.distribution_frequency || 'QUARTERLY',
      lock_up_days: params.lock_up_days || 180,
      status: 'DRAFT',
      compliance_status: 'PENDING',
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

    return saved;
  }

  async submitForApproval(id: string) {
    const asset = await this.findOne(id);
    if (asset.status !== 'DRAFT') throw new BadRequestException('Asset is not in DRAFT status');
    asset.status = 'PENDING_APPROVAL';
    return this.assetRepo.save(asset);
  }

  async approveAsset(id: string) {
    const asset = await this.findOne(id);
    if (asset.status !== 'PENDING_APPROVAL') throw new BadRequestException('Asset not pending approval');

    // Deploy token contract (mock)
    const deployment = await this.blockchainService.deployToken({
      name: asset.token_name,
      symbol: asset.token_symbol,
      totalSupply: asset.total_supply || '0',
    });

    asset.token_contract_address = deployment.contractAddress;
    asset.status = 'ACTIVE';
    asset.compliance_status = 'APPROVED';
    asset.cma_reference = `CMA-2026-TOK-${String(Date.now()).slice(-5)}`;
    asset.offering_start = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    asset.offering_end = endDate;

    // Register as a tradeable asset
    const baseAsset = this.baseAssetRepo.create({
      symbol: asset.token_symbol,
      name: asset.token_name,
      asset_type: 'SECURITY_TOKEN',
      chain: 'TRAMIA',
      contract_address: deployment.contractAddress,
      decimals: 18,
      is_tradeable: false,
      status: 'ACTIVE',
    });
    await this.baseAssetRepo.save(baseAsset);

    return this.assetRepo.save(asset);
  }

  async rejectAsset(id: string, notes?: string) {
    const asset = await this.findOne(id);
    asset.status = 'DRAFT';
    asset.compliance_status = 'REJECTED';
    if (notes) {
      asset.metadata = { ...(asset.metadata || {}), rejection_notes: notes };
    }
    return this.assetRepo.save(asset);
  }

  async invest(assetId: string, walletId: string, customerId: string, amountKes: number) {
    const asset = await this.findOne(assetId);
    if (asset.status !== 'ACTIVE') throw new BadRequestException('Offering not active');
    if (amountKes < parseFloat(asset.min_investment_kes)) {
      throw new BadRequestException(`Minimum investment is KES ${asset.min_investment_kes}`);
    }

    const tokenPrice = parseFloat(asset.token_price_kes);
    const tokenAmount = amountKes / tokenPrice;

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

    // Mock blockchain transfer
    const txResult = await this.blockchainService.transfer({
      tokenAddress: asset.token_contract_address || '0x0',
      from: 'escrow',
      to: walletId,
      amount: tokenAmount.toString(),
    });
    investment.blockchain_tx_hash = txResult.txHash;
    await this.investmentRepo.save(investment);

    // Update or create holding
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
    asset.current_investors = (asset.current_investors || 0) + 1;
    asset.total_raised_kes = (parseFloat(asset.total_raised_kes || '0') + amountKes).toString();
    await this.assetRepo.save(asset);

    return { investment, holding };
  }

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
