export const KYC_LIMITS = {
  0: { daily_kes: 10000, label: 'View Only' },
  1: { daily_kes: 100000, label: 'Basic Trading' },
  2: { daily_kes: 1000000, label: 'Full Trading' },
  3: { daily_kes: Infinity, label: 'Unlimited' },
};

export const DEPOSIT_LIMITS = {
  BANK_TRANSFER: { min: 500, max: 1000000 },
  MPESA: { min: 100, max: 150000 },
  CARD: { min: 500, max: 100000 },
};
