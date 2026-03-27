export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export type CustomerType = 'INDIVIDUAL' | 'BUSINESS';
export type KycLevel = 0 | 1 | 2 | 3;
export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
export type CustomerStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
export type WalletType = 'USER' | 'HOT' | 'COLD' | 'ESCROW' | 'FEE' | 'TREASURY';
export type WalletStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
export type Chain = 'TRAMIA' | 'ETH' | 'BTC';
export type AssetType = 'CRYPTO' | 'FIAT_TOKEN' | 'STABLECOIN' | 'SECURITY_TOKEN';
export type BalanceType = 'available' | 'pending' | 'locked' | 'staked';

export type DepositMethod = 'BANK_TRANSFER' | 'MPESA' | 'CARD';
export type DepositStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'PENDING_APPROVAL' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type OrderType = 'LIMIT' | 'MARKET';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK';

export type TokenizedAssetType = 'REAL_ESTATE' | 'INVOICE' | 'PURCHASE_ORDER' | 'FARM_PRODUCE' | 'BOND' | 'EQUITY';
export type TokenizedAssetStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'MINTING' | 'ACTIVE' | 'PAUSED' | 'MATURED' | 'REDEEMED' | 'CANCELLED';
export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'LAND' | 'MIXED_USE' | 'AGRICULTURAL';

export type AlertType = 'VELOCITY_HOURLY' | 'VELOCITY_DAILY' | 'STRUCTURING' | 'LARGE_TRANSACTION' | 'HIGH_RISK_JURISDICTION' | 'SANCTIONS_MATCH';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'NEW' | 'INVESTIGATING' | 'ESCALATED' | 'RESOLVED' | 'FALSE_POSITIVE';

export type AdminRole = 'COMPLIANCE_OFFICER' | 'ADMIN' | 'SUPER_ADMIN';
export type UserRole = 'CUSTOMER' | 'ISSUER' | 'COMPLIANCE_OFFICER' | 'ADMIN' | 'SUPER_ADMIN';
