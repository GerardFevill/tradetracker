export interface Account {
  id: string;
  broker: string;
  currency: string;
  current_balance: number;
  target_balance: number;
  withdraw_threshold: number;
  total_deposits: number;
  total_withdrawals: number;
}
