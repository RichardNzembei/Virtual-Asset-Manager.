export const SUPPORTED_ASSETS = {
  BTC: { symbol: 'BTC', name: 'Bitcoin', type: 'CRYPTO' as const, chain: 'BTC' as const, decimals: 8 },
  ETH: { symbol: 'ETH', name: 'Ethereum', type: 'CRYPTO' as const, chain: 'ETH' as const, decimals: 18 },
  tKES: { symbol: 'tKES', name: 'Tramia KES', type: 'FIAT_TOKEN' as const, chain: 'TRAMIA' as const, decimals: 2 },
  USDC: { symbol: 'USDC', name: 'USD Coin', type: 'STABLECOIN' as const, chain: 'TRAMIA' as const, decimals: 6 },
  USDT: { symbol: 'USDT', name: 'Tether', type: 'STABLECOIN' as const, chain: 'TRAMIA' as const, decimals: 6 },
};

export const TRADING_PAIRS = [
  { symbol: 'BTC/tKES', base: 'BTC', quote: 'tKES' },
  { symbol: 'ETH/tKES', base: 'ETH', quote: 'tKES' },
  { symbol: 'BTC/USDC', base: 'BTC', quote: 'USDC' },
  { symbol: 'USDC/tKES', base: 'USDC', quote: 'tKES' },
];

export const FEE_RATES = {
  DEPOSIT_KCB: 0.005,
  DEPOSIT_OTHER: 0.01,
  DEPOSIT_MPESA: 0.015,
  WITHDRAWAL_KCB: 0.005,
  MAKER_FEE: 0.001,
  TAKER_FEE: 0.002,
};
