import { pool } from '../db';
import { roundToTwoDecimals } from './number-formatter';

/**
 * Calcule le solde actuel d'un compte à partir de toutes ses transactions
 * @param accountId L'identifiant du compte
 * @returns Le solde calculé, arrondi à deux décimales
 */
export const calculateAccountBalance = async (accountId: string): Promise<number> => {
  try {
    // 1. Récupérer toutes les transactions où le compte est la source
    const sourceTransactionsResult = await pool.query(
      `SELECT type, amount FROM transactions WHERE "accountId" = $1`,
      [accountId]
    );
    
    // 2. Récupérer toutes les transactions de transfert où le compte est la destination
    const destinationTransfersResult = await pool.query(
      `SELECT amount, "exchangeRate" FROM transactions 
       WHERE "targetAccountId" = $1 AND type = 'transfer'`,
      [accountId]
    );
    
    // 3. Calculer l'impact des transactions sources sur le solde
    let balance = 0;
    
    for (const transaction of sourceTransactionsResult.rows) {
      switch (transaction.type) {
        case 'deposit':
        case 'profit':
          balance += parseFloat(transaction.amount);
          break;
        case 'withdrawal':
        case 'loss':
          balance -= parseFloat(transaction.amount);
          break;
        case 'transfer':
          balance -= parseFloat(transaction.amount);
          break;
      }
    }
    
    // 4. Ajouter l'impact des transferts entrants
    for (const transfer of destinationTransfersResult.rows) {
      // Si un taux de change est spécifié, l'appliquer
      const amount = transfer.exchangeRate 
        ? parseFloat(transfer.amount) * parseFloat(transfer.exchangeRate)
        : parseFloat(transfer.amount);
      
      balance += amount;
    }
    
    // 5. Arrondir le solde final à deux décimales
    return roundToTwoDecimals(balance);
  } catch (error) {
    console.error('Erreur lors du calcul du solde du compte:', error);
    throw error;
  }
};
