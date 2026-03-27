export class UnifiedBalanceResponse {
  wallet_id: string;
  customer_id: string;
  timestamp: string;
  fiat_balances: FiatBalance[];
  digital_balances: DigitalBalance[];
  total_value_kes: number;
}

export class FiatBalance {
  account_number: string;
  account_type: string;
  currency: string;
  available: number;
  current: number;
  source: string;
}

export class DigitalBalance {
  asset: string;
  available: string;
  pending: string;
  locked: string;
  value_kes: number;
}
