-- Migration pour ajouter la colonne initialCapital à la table accounts
ALTER TABLE accounts ADD COLUMN "initialCapital" NUMERIC NOT NULL DEFAULT 0;

-- Mettre à jour les comptes existants pour initialiser initialCapital avec currentBalance
-- Cette valeur pourra être ajustée manuellement par la suite
UPDATE accounts SET "initialCapital" = "currentBalance";

-- Ajouter un commentaire sur la colonne
COMMENT ON COLUMN accounts."initialCapital" IS 'Capital initial utilisé pour calculer les objectifs du plan de retrait fixe';
