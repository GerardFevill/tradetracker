-- Mise à jour des soldes des nouveaux comptes à zéro
UPDATE accounts SET 
  "currentBalance" = 0,
  "totalDeposits" = 0
WHERE name IN (
  'Roboforex 2301178',
  'IC Markets 23302741',
  'Roboforex 23080997',
  'IC Markets 6049976'
);
