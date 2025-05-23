import { Currency } from './account.model';

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'profit' | 'loss';

export interface Transaction {
  id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  date: Date;
  description?: string;
  source?: string; // Pour indiquer l'origine des fonds lors des dépôts et retraits
  target_account_id?: string; // Pour les transferts: ID du compte de destination
  exchange_rate?: number; // Pour les transferts entre devises différentes
}
