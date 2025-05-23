CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  broker VARCHAR(50) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  "currentBalance" NUMERIC NOT NULL DEFAULT 0,
  "targetBalance" NUMERIC NOT NULL DEFAULT 0,
  "withdrawalThreshold" NUMERIC NOT NULL DEFAULT 0,
  "totalDeposits" NUMERIC NOT NULL DEFAULT 0,
  "totalWithdrawals" NUMERIC NOT NULL DEFAULT 0,
  "totalProfits" NUMERIC NOT NULL DEFAULT 0,
  "totalLosses" NUMERIC NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  "accountId" UUID REFERENCES accounts(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  amount NUMERIC NOT NULL,
  currency VARCHAR(10) NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  source VARCHAR(100),
  "targetAccountId" UUID REFERENCES accounts(id) ON DELETE SET NULL,
  "exchangeRate" NUMERIC
);

-- Trigger pour mettre à jour le champ updatedAt des comptes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
