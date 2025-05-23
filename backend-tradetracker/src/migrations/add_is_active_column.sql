-- Ajouter la colonne isActive à la table accounts
ALTER TABLE accounts ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT TRUE;

-- Mettre à jour les comptes existants pour les définir comme actifs par défaut
UPDATE accounts SET "isActive" = TRUE WHERE "isActive" IS NULL;
