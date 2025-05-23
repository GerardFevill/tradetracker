-- Fonction pour calculer le solde d'un compte à partir de ses transactions
CREATE OR REPLACE FUNCTION calculate_account_balance(account_id UUID) RETURNS NUMERIC AS $$
DECLARE
    balance NUMERIC := 0;
BEGIN
    -- Ajouter les dépôts et profits
    SELECT COALESCE(SUM(amount), 0) INTO balance
    FROM transactions
    WHERE "accountId" = account_id AND (type = 'deposit' OR type = 'profit');
    
    -- Soustraire les retraits et pertes
    SELECT balance - COALESCE(SUM(amount), 0) INTO balance
    FROM transactions
    WHERE "accountId" = account_id AND (type = 'withdrawal' OR type = 'loss');
    
    -- Soustraire les transferts sortants
    SELECT balance - COALESCE(SUM(amount), 0) INTO balance
    FROM transactions
    WHERE "accountId" = account_id AND type = 'transfer';
    
    -- Ajouter les transferts entrants
    SELECT balance + COALESCE(SUM(
        CASE 
            WHEN "exchangeRate" IS NOT NULL THEN amount * "exchangeRate"
            ELSE amount
        END
    ), 0) INTO balance
    FROM transactions
    WHERE "targetAccountId" = account_id AND type = 'transfer';
    
    RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le solde d'un compte après une transaction
CREATE OR REPLACE FUNCTION update_account_balance() RETURNS TRIGGER AS $$
DECLARE
    source_account_id UUID;
    target_account_id UUID;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        source_account_id := NEW."accountId";
        target_account_id := NEW."targetAccountId";
    ELSIF TG_OP = 'DELETE' THEN
        source_account_id := OLD."accountId";
        target_account_id := OLD."targetAccountId";
    END IF;
    
    -- Mettre à jour le solde du compte source
    IF source_account_id IS NOT NULL THEN
        UPDATE accounts
        SET "currentBalance" = calculate_account_balance(source_account_id)
        WHERE id = source_account_id;
    END IF;
    
    -- Mettre à jour le solde du compte cible si c'est un transfert
    IF target_account_id IS NOT NULL THEN
        UPDATE accounts
        SET "currentBalance" = calculate_account_balance(target_account_id)
        WHERE id = target_account_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour les insertions, mises à jour et suppressions de transactions
DROP TRIGGER IF EXISTS update_account_balance_trigger ON transactions;
CREATE TRIGGER update_account_balance_trigger
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Recalculer les soldes de tous les comptes existants
DO $$
DECLARE
    account_record RECORD;
BEGIN
    FOR account_record IN SELECT id FROM accounts LOOP
        UPDATE accounts
        SET "currentBalance" = calculate_account_balance(account_record.id)
        WHERE id = account_record.id;
    END LOOP;
END;
$$;
