import { Currency } from './account.model';

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  date: Date;
  description?: string;
  targetAccountId?: string; // Pour les transferts: ID du compte de destination
  exchangeRate?: number; // Pour les transferts entre devises différentes
}
