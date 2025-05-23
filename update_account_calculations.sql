-- Fonction améliorée pour calculer tous les totaux d'un compte à partir de ses transactions
CREATE OR REPLACE FUNCTION calculate_account_totals(account_id UUID) 
RETURNS TABLE(
    current_balance NUMERIC,
    total_deposits NUMERIC,
    total_withdrawals NUMERIC,
    total_profits NUMERIC,
    total_losses NUMERIC
) AS $$
DECLARE
    balance NUMERIC := 0;
    deposits NUMERIC := 0;
    withdrawals NUMERIC := 0;
    profits NUMERIC := 0;
    losses NUMERIC := 0;
BEGIN
    -- Calculer les dépôts
    SELECT COALESCE(SUM(amount), 0) INTO deposits
    FROM transactions
    WHERE "accountId" = account_id AND type = 'deposit';
    
    -- Calculer les retraits
    SELECT COALESCE(SUM(amount), 0) INTO withdrawals
    FROM transactions
    WHERE "accountId" = account_id AND type = 'withdrawal';
    
    -- Calculer les profits
    SELECT COALESCE(SUM(amount), 0) INTO profits
    FROM transactions
    WHERE "accountId" = account_id AND type = 'profit';
    
    -- Calculer les pertes
    SELECT COALESCE(SUM(amount), 0) INTO losses
    FROM transactions
    WHERE "accountId" = account_id AND type = 'loss';
    
    -- Calculer les transferts sortants (considérés comme des retraits)
    SELECT withdrawals + COALESCE(SUM(amount), 0) INTO withdrawals
    FROM transactions
    WHERE "accountId" = account_id AND type = 'transfer';
    
    -- Calculer les transferts entrants (considérés comme des dépôts)
    SELECT deposits + COALESCE(SUM(
        CASE 
            WHEN "exchangeRate" IS NOT NULL THEN amount * "exchangeRate"
            ELSE amount
        END
    ), 0) INTO deposits
    FROM transactions
    WHERE "targetAccountId" = account_id AND type = 'transfer';
    
    -- Calculer le solde actuel
    balance := deposits - withdrawals + profits - losses;
    
    RETURN QUERY SELECT balance, deposits, withdrawals, profits, losses;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement tous les totaux d'un compte après une transaction
CREATE OR REPLACE FUNCTION update_account_totals() RETURNS TRIGGER AS $$
DECLARE
    source_account_id UUID;
    target_account_id UUID;
    source_totals RECORD;
    target_totals RECORD;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        source_account_id := NEW."accountId";
        target_account_id := NEW."targetAccountId";
    ELSIF TG_OP = 'DELETE' THEN
        source_account_id := OLD."accountId";
        target_account_id := OLD."targetAccountId";
    END IF;
    
    -- Mettre à jour les totaux du compte source
    IF source_account_id IS NOT NULL THEN
        SELECT * FROM calculate_account_totals(source_account_id) INTO source_totals;
        
        UPDATE accounts
        SET 
            "currentBalance" = source_totals.current_balance,
            "totalDeposits" = source_totals.total_deposits,
            "totalWithdrawals" = source_totals.total_withdrawals,
            "totalProfits" = source_totals.total_profits,
            "totalLosses" = source_totals.total_losses
        WHERE id = source_account_id;
    END IF;
    
    -- Mettre à jour les totaux du compte cible si c'est un transfert
    IF target_account_id IS NOT NULL THEN
        SELECT * FROM calculate_account_totals(target_account_id) INTO target_totals;
        
        UPDATE accounts
        SET 
            "currentBalance" = target_totals.current_balance,
            "totalDeposits" = target_totals.total_deposits,
            "totalWithdrawals" = target_totals.total_withdrawals,
            "totalProfits" = target_totals.total_profits,
            "totalLosses" = target_totals.total_losses
        WHERE id = target_account_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Remplacer le trigger existant
DROP TRIGGER IF EXISTS update_account_balance_trigger ON transactions;
CREATE TRIGGER update_account_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_account_totals();

-- Ajouter une contrainte pour empêcher les transferts entre le même compte
CREATE OR REPLACE FUNCTION check_transfer_constraints() RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier si c'est un transfert
    IF NEW.type = 'transfer' THEN
        -- Vérifier que le compte source et le compte cible ne sont pas identiques
        IF NEW."accountId" = NEW."targetAccountId" THEN
            RAISE EXCEPTION 'Impossible de transférer de l''argent d''un compte vers lui-même';
        END IF;
        
        -- Vérifier que les comptes source et cible ont le même broker
        DECLARE
            source_broker TEXT;
            target_broker TEXT;
        BEGIN
            SELECT broker INTO source_broker FROM accounts WHERE id = NEW."accountId";
            SELECT broker INTO target_broker FROM accounts WHERE id = NEW."targetAccountId";
            
            IF source_broker != target_broker THEN
                RAISE EXCEPTION 'Impossible de transférer de l''argent entre des comptes de brokers différents (% vs %)', source_broker, target_broker;
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour vérifier les contraintes de transfert
DROP TRIGGER IF EXISTS check_transfer_constraints_trigger ON transactions;
CREATE TRIGGER check_transfer_constraints_trigger
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION check_transfer_constraints();

-- Recalculer les totaux de tous les comptes existants
DO $$
DECLARE
    account_record RECORD;
    account_totals RECORD;
BEGIN
    FOR account_record IN SELECT id FROM accounts LOOP
        SELECT * FROM calculate_account_totals(account_record.id) INTO account_totals;
        
        UPDATE accounts
        SET 
            "currentBalance" = account_totals.current_balance,
            "totalDeposits" = account_totals.total_deposits,
            "totalWithdrawals" = account_totals.total_withdrawals,
            "totalProfits" = account_totals.total_profits,
            "totalLosses" = account_totals.total_losses
        WHERE id = account_record.id;
    END LOOP;
END;
$$;
