export type Currency = 'USD' | 'EUR';
export type Broker = 'Roboforex' | 'IC Markets' | 'Other';

export interface Account {
  id: string;
  name: string;
  broker: Broker;
  currency: Currency;
  currentBalance: number;
  targetBalance: number;
  withdrawalThreshold: number;
  totalDeposits: number;
  totalWithdrawals: number;
  createdAt: Date;
  updatedAt: Date;
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
