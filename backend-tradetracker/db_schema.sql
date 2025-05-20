CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  broker VARCHAR(50),
  currency VARCHAR(10),
  current_balance NUMERIC,
  target_balance NUMERIC,
  withdraw_threshold NUMERIC,
  total_deposits NUMERIC,
  total_withdrawals NUMERIC
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  type VARCHAR(20),
  amount NUMERIC,
  date TIMESTAMP,
  comment TEXT
);
