import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

import { Customer } from '../../modules/customers/entities/customer.entity';
import { Asset } from '../../modules/wallets/entities/asset.entity';
import { Wallet } from '../../modules/wallets/entities/wallet.entity';
import { WalletAddress } from '../../modules/wallets/entities/wallet-address.entity';
import { WalletBalance } from '../../modules/wallets/entities/wallet-balance.entity';
import { BalanceLedger } from '../../modules/wallets/entities/balance-ledger.entity';
import { LinkedBankAccount } from '../../modules/fiat-gateway/entities/linked-bank-account.entity';
import { FiatDeposit } from '../../modules/fiat-gateway/entities/fiat-deposit.entity';
import { FiatWithdrawal } from '../../modules/fiat-gateway/entities/fiat-withdrawal.entity';
import { TradingPair } from '../../modules/trading/entities/trading-pair.entity';
import { Order } from '../../modules/trading/entities/order.entity';
import { Trade } from '../../modules/trading/entities/trade.entity';
import { Issuer } from '../../modules/tokenization/entities/issuer.entity';
import { TokenizedAsset } from '../../modules/tokenization/entities/tokenized-asset.entity';
import { RealEstateAsset } from '../../modules/tokenization/entities/real-estate-asset.entity';
import { TokenHolding } from '../../modules/tokenization/entities/token-holding.entity';
import { Investment } from '../../modules/tokenization/entities/investment.entity';
import { KycRecord } from '../../modules/compliance/entities/kyc-record.entity';
import { AmlAlert } from '../../modules/compliance/entities/aml-alert.entity';
import { AdminUser } from '../../modules/admin/entities/admin-user.entity';
import { Session } from '../../modules/auth/entities/session.entity';

const entities = [
  Customer, Asset, Wallet, WalletAddress, WalletBalance, BalanceLedger,
  LinkedBankAccount, FiatDeposit, FiatWithdrawal,
  TradingPair, Order, Trade,
  Issuer, TokenizedAsset, RealEstateAsset, TokenHolding, Investment,
  KycRecord, AmlAlert, AdminUser, Session,
];

async function seed() {
  const ds = new DataSource({
    type: 'mysql',
    host: process.env.S_DATABASE_HOST || 'localhost',
    port: parseInt(process.env.S_DATABASE_PORT || '3306', 10),
    username: process.env.S_DATABASE_USER || 'siku_zangu',
    password: process.env.S_DATABASE_PASSWORD || 'Saint@mysql4',
    database: process.env.S_DATABASE_NAME || 'siku_zangu',
    entities,
    synchronize: true,
    logging: false,
  });

  await ds.initialize();
  console.log('Database connected. Seeding...');

  // ===== 1. ASSETS =====
  const assetRepo = ds.getRepository(Asset);
  const existingAssets = await assetRepo.count();
  if (existingAssets > 0) {
    console.log('Data already exists. Skipping seed.');
    await ds.destroy();
    return;
  }

  const btc = await assetRepo.save(assetRepo.create({ symbol: 'BTC', name: 'Bitcoin', asset_type: 'CRYPTO', chain: 'BTC', decimals: 8 }));
  const eth = await assetRepo.save(assetRepo.create({ symbol: 'ETH', name: 'Ethereum', asset_type: 'CRYPTO', chain: 'ETH', decimals: 18 }));
  const tkes = await assetRepo.save(assetRepo.create({ symbol: 'tKES', name: 'Tramia KES', asset_type: 'FIAT_TOKEN', chain: 'TRAMIA', decimals: 2, contract_address: '0xTKES000000000000000000000000000000000001' }));
  const usdc = await assetRepo.save(assetRepo.create({ symbol: 'USDC', name: 'USD Coin', asset_type: 'STABLECOIN', chain: 'TRAMIA', decimals: 6 }));
  const usdt = await assetRepo.save(assetRepo.create({ symbol: 'USDT', name: 'Tether', asset_type: 'STABLECOIN', chain: 'TRAMIA', decimals: 6 }));
  console.log('Assets seeded');

  // ===== 2. CUSTOMERS =====
  const custRepo = ds.getRepository(Customer);
  const amara = await custRepo.save(custRepo.create({
    bank_cif: 'KCB-00423891', customer_type: 'INDIVIDUAL',
    first_name: 'Amara', last_name: 'Osei', email: 'amara@demo.tramia.io',
    phone: '+254700000001', national_id: '12345678',
    kyc_level: 2, kyc_status: 'VERIFIED', risk_score: 12, risk_category: 'LOW', status: 'ACTIVE',
  }));
  const james = await custRepo.save(custRepo.create({
    bank_cif: 'KCB-00567234', customer_type: 'INDIVIDUAL',
    first_name: 'James', last_name: 'Mwangi', email: 'james@demo.tramia.io',
    phone: '+254700000002', national_id: '87654321',
    kyc_level: 3, kyc_status: 'VERIFIED', risk_score: 8, risk_category: 'LOW', status: 'ACTIVE',
  }));
  const fatuma = await custRepo.save(custRepo.create({
    bank_cif: 'KCB-00891456', customer_type: 'INDIVIDUAL',
    first_name: 'Fatuma', last_name: 'Hassan', email: 'fatuma@demo.tramia.io',
    phone: '+254700000003', national_id: '11223344',
    kyc_level: 2, kyc_status: 'VERIFIED', risk_score: 5, risk_category: 'LOW', status: 'ACTIVE',
  }));
  const sysbot = await custRepo.save(custRepo.create({
    bank_cif: 'SYS-00000001', customer_type: 'INDIVIDUAL',
    first_name: 'System', last_name: 'Bot', email: 'sysadmin@tramia.io',
    phone: '+254700000004', kyc_level: 0, kyc_status: 'PENDING', status: 'ACTIVE',
  }));
  console.log('Customers seeded');

  // ===== 3. WALLETS =====
  const walletRepo = ds.getRepository(Wallet);
  const addrRepo = ds.getRepository(WalletAddress);

  const createWalletWithAddresses = async (customerId: string, type: string, name: string) => {
    const w = await walletRepo.save(walletRepo.create({
      customer_id: customerId, wallet_type: type, wallet_name: name,
      status: 'ACTIVE', mpc_key_id: `mpc-${uuidv4().slice(0, 16)}`,
      activated_at: new Date(),
    }));
    for (const chain of ['TRAMIA', 'ETH', 'BTC']) {
      const prefix = chain === 'BTC' ? 'bc1q' : '0x';
      const addr = prefix + uuidv4().replace(/-/g, '').slice(0, chain === 'BTC' ? 38 : 40);
      await addrRepo.save(addrRepo.create({
        wallet_id: w.id, chain, address: addr, derivation_path: `m/44'/0'/0'/0/0`, is_primary: true,
      }));
    }
    return w;
  };

  const amaraWallet = await createWalletWithAddresses(amara.id, 'USER', 'Amara Wallet');
  const jamesWallet = await createWalletWithAddresses(james.id, 'USER', 'James Wallet');
  const hotWallet = await createWalletWithAddresses(sysbot.id, 'HOT', 'Hot Wallet');
  const escrowWallet = await createWalletWithAddresses(sysbot.id, 'ESCROW', 'Escrow Wallet');
  const feeWallet = await createWalletWithAddresses(sysbot.id, 'FEE', 'Fee Wallet');
  console.log('Wallets seeded');

  // ===== 4. BANK ACCOUNTS =====
  const baRepo = ds.getRepository(LinkedBankAccount);
  const amaraBank = await baRepo.save(baRepo.create({
    wallet_id: amaraWallet.id, customer_id: amara.id, bank_code: 'KCB',
    account_number: '0423891001', account_name: 'Amara Osei - Savings',
    account_type: 'SAVINGS', is_primary: true, is_verified: true, status: 'ACTIVE',
  }));
  const jamesBank = await baRepo.save(baRepo.create({
    wallet_id: jamesWallet.id, customer_id: james.id, bank_code: 'KCB',
    account_number: '0567234001', account_name: 'James Mwangi - Current',
    account_type: 'CURRENT', is_primary: true, is_verified: true, status: 'ACTIVE',
  }));
  console.log('Bank accounts seeded');

  // ===== 5. WALLET BALANCES =====
  const balRepo = ds.getRepository(WalletBalance);
  const allAssets = [btc, eth, tkes, usdc, usdt];
  const wallets = [amaraWallet, jamesWallet, hotWallet, escrowWallet, feeWallet];

  for (const w of wallets) {
    for (const a of allAssets) {
      await balRepo.save(balRepo.create({
        wallet_id: w.id, asset_id: a.id,
        available: '0', pending: '0', locked: '0', staked: '0',
      }));
    }
  }

  // Set specific balances
  const setBalance = async (walletId: string, assetId: string, available: string) => {
    await balRepo.update({ wallet_id: walletId, asset_id: assetId }, { available });
  };

  await setBalance(amaraWallet.id, btc.id, '0.05000000');
  await setBalance(amaraWallet.id, tkes.id, '49750.00');
  await setBalance(amaraWallet.id, eth.id, '0.50000000');
  await setBalance(jamesWallet.id, tkes.id, '100000.00');
  await setBalance(hotWallet.id, btc.id, '5.00000000');
  await setBalance(hotWallet.id, eth.id, '50.00000000');
  await setBalance(hotWallet.id, tkes.id, '1000000.00');
  await setBalance(escrowWallet.id, tkes.id, '5000000.00');
  console.log('Balances seeded');

  // ===== 6. TRADING PAIRS =====
  const pairRepo = ds.getRepository(TradingPair);
  const btcTkes = await pairRepo.save(pairRepo.create({
    symbol: 'BTC/tKES', base_asset_id: btc.id, quote_asset_id: tkes.id,
    price_precision: 0, quantity_precision: 8, min_quantity: '0.00001000', min_notional: '500',
    maker_fee_rate: '0.0010', taker_fee_rate: '0.0020', status: 'ACTIVE',
  }));
  await pairRepo.save(pairRepo.create({
    symbol: 'ETH/tKES', base_asset_id: eth.id, quote_asset_id: tkes.id,
    price_precision: 0, quantity_precision: 8, min_quantity: '0.00010000', min_notional: '500',
    maker_fee_rate: '0.0010', taker_fee_rate: '0.0020', status: 'ACTIVE',
  }));
  await pairRepo.save(pairRepo.create({
    symbol: 'BTC/USDC', base_asset_id: btc.id, quote_asset_id: usdc.id,
    price_precision: 2, quantity_precision: 8, min_quantity: '0.00001000', min_notional: '10',
    maker_fee_rate: '0.0010', taker_fee_rate: '0.0020', status: 'ACTIVE',
  }));
  await pairRepo.save(pairRepo.create({
    symbol: 'USDC/tKES', base_asset_id: usdc.id, quote_asset_id: tkes.id,
    price_precision: 2, quantity_precision: 2, min_quantity: '1.00', min_notional: '100',
    maker_fee_rate: '0.0005', taker_fee_rate: '0.0010', status: 'ACTIVE',
  }));
  console.log('Trading pairs seeded');

  // ===== 7. SAMPLE ORDERS (order book for BTC/tKES) =====
  const orderRepo = ds.getRepository(Order);
  const basePrice = 13000000;

  // 10 buy orders
  for (let i = 0; i < 10; i++) {
    const price = basePrice - (i + 1) * 10000;
    const qty = (0.001 + Math.random() * 0.01).toFixed(8);
    await orderRepo.save(orderRepo.create({
      wallet_id: hotWallet.id, customer_id: sysbot.id, pair_id: btcTkes.id,
      order_type: 'LIMIT', side: 'BUY', time_in_force: 'GTC',
      quantity: qty, price: price.toString(), filled_quantity: '0',
      remaining_quantity: qty, status: 'OPEN',
    }));
  }
  // 10 sell orders
  for (let i = 0; i < 10; i++) {
    const price = basePrice + (i + 1) * 10000;
    const qty = (0.001 + Math.random() * 0.01).toFixed(8);
    await orderRepo.save(orderRepo.create({
      wallet_id: hotWallet.id, customer_id: sysbot.id, pair_id: btcTkes.id,
      order_type: 'LIMIT', side: 'SELL', time_in_force: 'GTC',
      quantity: qty, price: price.toString(), filled_quantity: '0',
      remaining_quantity: qty, status: 'OPEN',
    }));
  }
  console.log('Sample orders seeded');

  // ===== 8. TOKENIZED ASSETS (Issuer + RWA) =====
  const issuerRepo = ds.getRepository(Issuer);
  const tokenAssetRepo = ds.getRepository(TokenizedAsset);
  const reRepo = ds.getRepository(RealEstateAsset);
  const holdingRepo = ds.getRepository(TokenHolding);
  const investRepo = ds.getRepository(Investment);

  const jamesIssuer = await issuerRepo.save(issuerRepo.create({
    customer_id: james.id, company_name: 'Westlands Realty SPV Ltd',
    registration_number: 'SPV-2026-001', status: 'APPROVED', approved_at: new Date(),
  }));

  // Active offering: Kilimani Heights
  const kilimani = await tokenAssetRepo.save(tokenAssetRepo.create({
    asset_type: 'REAL_ESTATE', issuer_id: jamesIssuer.id,
    name: 'Kilimani Heights Apartments', description: 'Premium residential apartments in Kilimani, Nairobi',
    token_symbol: 'KLMNI', token_name: 'Kilimani Heights Token',
    token_contract_address: '0xKLMNI0000000000000000000000000000000001',
    total_supply: '500000', tokens_outstanding: '300000', token_price_kes: '100',
    asset_value_kes: '50000000', min_investment_kes: '100',
    current_investors: 156, total_raised_kes: '30000000',
    expected_yield: '12.00', distribution_frequency: 'QUARTERLY', lock_up_days: 180,
    offering_start: new Date('2026-01-15'), offering_end: new Date('2026-06-30'),
    status: 'ACTIVE', compliance_status: 'APPROVED', cma_reference: 'CMA-2026-TOK-00101',
  }));

  await reRepo.save(reRepo.create({
    tokenized_asset_id: kilimani.id, property_type: 'RESIDENTIAL',
    address: '14 Kilimani Road', city: 'Nairobi', county: 'Nairobi',
    title_number: 'I.R. 28401/NBI', land_size_sqm: '1800', building_size_sqm: '2400',
    current_valuation_kes: '50000000', rental_income_monthly_kes: '500000',
    occupancy_rate: '85', spv_name: 'Kilimani Heights SPV Ltd',
  }));

  // Register KLMNI as a tradeable asset
  await assetRepo.save(assetRepo.create({
    symbol: 'KLMNI', name: 'Kilimani Heights Token', asset_type: 'SECURITY_TOKEN',
    chain: 'TRAMIA', contract_address: '0xKLMNI0000000000000000000000000000000001',
    decimals: 18, is_tradeable: false, status: 'ACTIVE',
  }));

  // Pending offering: Westlands Apartments
  const westlands = await tokenAssetRepo.save(tokenAssetRepo.create({
    asset_type: 'REAL_ESTATE', issuer_id: jamesIssuer.id,
    name: 'Westlands Apartments Block A', description: '6-floor residential block in Westlands, 24 units',
    token_symbol: 'WLAPT', token_name: 'Westlands Apartment Token',
    total_supply: '1200000', token_price_kes: '100',
    asset_value_kes: '120000000', min_investment_kes: '100',
    expected_yield: '4.80', distribution_frequency: 'QUARTERLY', lock_up_days: 180,
    status: 'PENDING_APPROVAL', compliance_status: 'PENDING',
  }));

  await reRepo.save(reRepo.create({
    tokenized_asset_id: westlands.id, property_type: 'RESIDENTIAL',
    address: 'Westlands Road', city: 'Nairobi', county: 'Nairobi',
    title_number: 'I.R. 29847/NBI', land_size_sqm: '2400', building_size_sqm: '3200',
    current_valuation_kes: '120000000', rental_income_monthly_kes: '480000',
    occupancy_rate: '80', spv_name: 'Westlands Realty SPV Ltd',
    spv_registration_number: 'SPV-2026-001',
  }));

  // Amara's investment in Kilimani
  await holdingRepo.save(holdingRepo.create({
    asset_id: kilimani.id, wallet_id: amaraWallet.id, customer_id: amara.id,
    balance: '500', locked_balance: '0', acquisition_price_avg: '100',
    lock_up_until: new Date('2026-09-15'),
  }));
  await investRepo.save(investRepo.create({
    asset_id: kilimani.id, wallet_id: amaraWallet.id, customer_id: amara.id,
    amount_kes: '50000', token_amount: '500', token_price: '100',
    blockchain_tx_hash: '0x7BA30000000000000000000000000000000000000000000000000000C220',
    status: 'COMPLETED', completed_at: new Date(),
  }));
  console.log('Tokenized assets seeded');

  // ===== 9. COMPLIANCE DATA =====
  const alertRepo = ds.getRepository(AmlAlert);
  const kycRepo = ds.getRepository(KycRecord);

  // Alerts
  await alertRepo.save([
    alertRepo.create({ customer_id: amara.id, alert_type: 'VELOCITY_DAILY', severity: 'LOW', rule_id: 'RULE_VEL_DAILY', description: '8 transactions in 24 hours', status: 'FALSE_POSITIVE', resolved_at: new Date() }),
    alertRepo.create({ customer_id: james.id, alert_type: 'LARGE_TRANSACTION', severity: 'MEDIUM', rule_id: 'RULE_LARGE_TX', description: 'Deposit of KES 2,500,000', status: 'FALSE_POSITIVE', resolved_at: new Date() }),
    alertRepo.create({ customer_id: amara.id, alert_type: 'STRUCTURING', severity: 'HIGH', rule_id: 'RULE_STRUCT', description: '3 transactions near KES 1M threshold: KES 950,000 | KES 920,000 | KES 940,000', status: 'NEW', details: { transactions: [950000, 920000, 940000], total: 2810000 } }),
    alertRepo.create({ customer_id: james.id, alert_type: 'VELOCITY_HOURLY', severity: 'HIGH', rule_id: 'RULE_VEL_HOURLY', description: '6 transactions in 1 hour', status: 'INVESTIGATING' }),
    alertRepo.create({ customer_id: fatuma.id, alert_type: 'HIGH_RISK_JURISDICTION', severity: 'MEDIUM', rule_id: 'RULE_JURISDICTION', description: 'Transfer from high-risk jurisdiction (CN)', status: 'NEW' }),
    alertRepo.create({ customer_id: amara.id, alert_type: 'LARGE_TRANSACTION', severity: 'MEDIUM', rule_id: 'RULE_LARGE_TX', description: 'Withdrawal of KES 1,200,000', status: 'NEW' }),
  ]);

  // KYC records
  await kycRepo.save([
    kycRepo.create({ customer_id: amara.id, kyc_level: 1, verification_method: 'BANK_KYC_INHERIT', id_type: 'NATIONAL_ID', id_number: '12345678', verification_result: 'VERIFIED', verifier: 'KCB IPRS', verified_at: new Date('2026-01-15'), status: 'ACTIVE' }),
    kycRepo.create({ customer_id: amara.id, kyc_level: 2, verification_method: 'DOCUMENT_REVIEW', id_type: 'NATIONAL_ID', id_number: '12345678', verification_result: 'VERIFIED', verifier: 'Fatuma Hassan', verified_at: new Date('2026-02-01'), status: 'ACTIVE' }),
    kycRepo.create({ customer_id: james.id, kyc_level: 3, verification_method: 'ENHANCED_DUE_DILIGENCE', id_type: 'NATIONAL_ID', id_number: '87654321', verification_result: 'VERIFIED', verifier: 'Fatuma Hassan', verified_at: new Date('2026-01-20'), status: 'ACTIVE' }),
    kycRepo.create({ customer_id: fatuma.id, kyc_level: 2, verification_method: 'BANK_KYC_INHERIT', id_type: 'NATIONAL_ID', id_number: '11223344', verification_result: 'VERIFIED', verifier: 'KCB IPRS', verified_at: new Date('2026-01-10'), status: 'ACTIVE' }),
  ]);
  console.log('Compliance data seeded');

  // ===== 10. ADMIN USERS =====
  const adminRepo = ds.getRepository(AdminUser);
  const hashPw = async (pw: string) => bcrypt.hash(pw, 10);

  await adminRepo.save([
    adminRepo.create({ email: 'fatuma@tramia.io', password_hash: await hashPw('TramiaDemo2026!'), name: 'Fatuma Hassan', role: 'COMPLIANCE_OFFICER', status: 'ACTIVE' }),
    adminRepo.create({ email: 'admin@tramia.io', password_hash: await hashPw('TramiaAdmin2026!'), name: 'Sysadmin Bot', role: 'SUPER_ADMIN', status: 'ACTIVE' }),
    adminRepo.create({ email: 'james@tramia.io', password_hash: await hashPw('TramiaIssuer2026!'), name: 'James Mwangi', role: 'ADMIN', status: 'ACTIVE' }),
  ]);
  console.log('Admin users seeded');

  console.log('\n=== SEED COMPLETE ===');
  console.log('Demo Logins:');
  console.log('  Customer (Amara): phone +254700000001');
  console.log('  Customer (James): phone +254700000002');
  console.log('  Admin (Fatuma): fatuma@tramia.io / TramiaDemo2026!');
  console.log('  Admin (Sysadmin): admin@tramia.io / TramiaAdmin2026!');

  await ds.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
