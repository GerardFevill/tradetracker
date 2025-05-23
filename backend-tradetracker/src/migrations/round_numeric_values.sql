-- Migration pour arrondir les valeurs numériques à deux décimales dans la base de données

-- 1. Fonction pour arrondir les valeurs numériques à deux décimales
CREATE OR REPLACE FUNCTION round_to_two_decimals(value NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
    RETURN ROUND(value::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger pour arrondir automatiquement les valeurs numériques des comptes
CREATE OR REPLACE FUNCTION round_account_numeric_values()
RETURNS TRIGGER AS $$
BEGIN
    NEW."currentBalance" = round_to_two_decimals(NEW."currentBalance");
    NEW."targetBalance" = round_to_two_decimals(NEW."targetBalance");
    NEW."withdrawalThreshold" = round_to_two_decimals(NEW."withdrawalThreshold");
    NEW."totalDeposits" = round_to_two_decimals(NEW."totalDeposits");
    NEW."totalWithdrawals" = round_to_two_decimals(NEW."totalWithdrawals");
    NEW."totalProfits" = round_to_two_decimals(NEW."totalProfits");
    NEW."totalLosses" = round_to_two_decimals(NEW."totalLosses");
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger pour arrondir automatiquement les valeurs numériques des transactions
CREATE OR REPLACE FUNCTION round_transaction_numeric_values()
RETURNS TRIGGER AS $$
BEGIN
    NEW.amount = round_to_two_decimals(NEW.amount);
    
    -- Arrondir le taux de change s'il est défini
    IF NEW."exchangeRate" IS NOT NULL THEN
        NEW."exchangeRate" = round_to_two_decimals(NEW."exchangeRate");
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Appliquer les triggers aux tables
DROP TRIGGER IF EXISTS round_account_values ON accounts;
CREATE TRIGGER round_account_values
BEFORE INSERT OR UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION round_account_numeric_values();

DROP TRIGGER IF EXISTS round_transaction_values ON transactions;
CREATE TRIGGER round_transaction_values
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION round_transaction_numeric_values();

-- 5. Mettre à jour les valeurs existantes dans la base de données
UPDATE accounts SET
    "currentBalance" = round_to_two_decimals("currentBalance"),
    "targetBalance" = round_to_two_decimals("targetBalance"),
    "withdrawalThreshold" = round_to_two_decimals("withdrawalThreshold"),
    "totalDeposits" = round_to_two_decimals("totalDeposits"),
    "totalWithdrawals" = round_to_two_decimals("totalWithdrawals"),
    "totalProfits" = round_to_two_decimals("totalProfits"),
    "totalLosses" = round_to_two_decimals("totalLosses");

UPDATE transactions SET
    amount = round_to_two_decimals(amount),
    "exchangeRate" = CASE 
                        WHEN "exchangeRate" IS NOT NULL THEN round_to_two_decimals("exchangeRate")
                        ELSE NULL
                     END;
