export interface Transaction {
  id: string;
  account_id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  date: string;
  comment?: string;
}
