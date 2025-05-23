-- Mise à jour du broker du compte 2301178 à IC Markets
UPDATE accounts SET 
  broker = 'IC Markets',
  name = 'IC Markets 2301178'
WHERE name = 'Roboforex 2301178';
