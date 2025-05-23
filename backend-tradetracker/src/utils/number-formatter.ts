/**
 * Arrondit un nombre à deux chiffres après la virgule
 * @param value Le nombre à arrondir
 * @returns Le nombre arrondi à deux décimales
 */
export const roundToTwoDecimals = (value: number | string): number => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return Math.round(numValue * 100) / 100;
};

/**
 * Formate les champs numériques d'un compte à deux chiffres après la virgule
 * @param account L'objet compte à formater
 * @returns L'objet compte avec les champs numériques formatés
 */
export const formatAccountNumbers = (account: any): any => {
  if (!account) return account;
  
  const formattedAccount = { ...account };
  
  // Liste des champs numériques à formater
  const numericFields = [
    'currentBalance',
    'initialBalance',
    'targetBalance',
    'withdrawalThreshold',
    'totalDeposits',
    'totalWithdrawals',
    'totalProfits',
    'totalLosses'
  ];
  
  // Formater chaque champ numérique
  for (const field of numericFields) {
    if (formattedAccount[field] !== undefined && formattedAccount[field] !== null) {
      formattedAccount[field] = roundToTwoDecimals(formattedAccount[field]);
    }
  }
  
  return formattedAccount;
};

/**
 * Formate les champs numériques d'un tableau de comptes à deux chiffres après la virgule
 * @param accounts Le tableau de comptes à formater
 * @returns Le tableau de comptes avec les champs numériques formatés
 */
export const formatAccountsArray = (accounts: any[]): any[] => {
  if (!accounts || !Array.isArray(accounts)) return accounts;
  return accounts.map(account => formatAccountNumbers(account));
};
