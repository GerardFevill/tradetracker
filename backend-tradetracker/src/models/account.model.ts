export type Currency = 'USD' | 'EUR';
export type Broker = 'Roboforex' | 'IC Markets' | 'Other';

export interface Account {
  id: string;
  name: string;
  broker: Broker;
  currency: Currency;
  currentBalance: number;
  initialCapital: number; // Capital initial pour le plan de retrait fixe
  targetBalance: number;
  withdrawalThreshold: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalProfits: number;
  totalLosses: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AccountSummary {
  totalAccounts: number;
  totalBalanceUSD: number;
  totalBalanceEUR: number;
  totalTargetUSD: number;
  totalTargetEUR: number;
  performanceUSD: number; // Percentage
  performanceEUR: number; // Percentage
}
