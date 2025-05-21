import { Currency } from './account.model';

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'profit' | 'loss';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  date: Date;
  description?: string;
  source?: string; // Pour indiquer l'origine des fonds lors des dépôts et retraits
  targetAccountId?: string; // Pour les transferts: ID du compte de destination
  exchangeRate?: number; // Pour les transferts entre devises différentes
}
