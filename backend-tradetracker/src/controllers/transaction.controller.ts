import { Request, Response } from 'express';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { TransactionType } from '../models/transaction.model';
import { calculateAccountBalance } from '../utils/balance-calculator';

// Récupérer toutes les transactions
export const getTransactions = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des transactions' });
  }
};

// Récupérer les transactions par compte
export const getTransactionsByAccount = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    
    // Récupérer les transactions où le compte est la source
    const sourceResult = await pool.query(
      'SELECT * FROM transactions WHERE "accountId" = $1',
      [accountId]
    );
    
    // Récupérer les transactions de type transfert où le compte est la destination
    const destinationResult = await pool.query(
      'SELECT * FROM transactions WHERE "targetAccountId" = $1 AND type = \'transfer\'',
      [accountId]
    );
    
    // Combiner les résultats
    const allTransactions = [...sourceResult.rows, ...destinationResult.rows];
    
    // Trier par date décroissante
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    res.json(allTransactions);
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions par compte:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des transactions par compte' });
  }
};

// Récupérer une transaction par son ID
export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de la transaction:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la transaction' });
  }
};

// Récupérer les transactions par type
export const getTransactionsByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const result = await pool.query(
      'SELECT * FROM transactions WHERE type = $1 ORDER BY date DESC',
      [type]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions par type:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des transactions par type' });
  }
};

// Créer une nouvelle transaction
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    const {
      accountId,
      type,
      amount,
      date,
      description,
      currency,
      source,
      targetAccountId,
      exchangeRate
    } = req.body;
    
    // Définir la date du jour si elle n'est pas spécifiée
    const transactionDate = date || new Date();

    // Vérifier si le compte existe
    const accountCheck = await pool.query('SELECT * FROM accounts WHERE id = $1', [accountId]);
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Compte non trouvé' });
    }

    // Récupérer les informations du compte pour la mise à jour
    const account = accountCheck.rows[0];
    let updatedAccount = { ...account };

    // Mettre à jour le compte en fonction du type de transaction
    switch (type) {
      case 'deposit':
        updatedAccount.currentBalance = parseFloat(account.currentBalance) + amount;
        updatedAccount.totalDeposits = parseFloat(account.totalDeposits) + amount;
        break;
      case 'withdrawal':
        if (parseFloat(account.currentBalance) < amount) {
          return res.status(400).json({ message: 'Solde insuffisant pour effectuer ce retrait' });
        }
        updatedAccount.currentBalance = parseFloat(account.currentBalance) - amount;
        updatedAccount.totalWithdrawals = parseFloat(account.totalWithdrawals) + amount;
        break;
      case 'profit':
        updatedAccount.currentBalance = parseFloat(account.currentBalance) + amount;
        updatedAccount.totalProfits = parseFloat(account.totalProfits) + amount;
        break;
      case 'loss':
        if (parseFloat(account.currentBalance) < amount) {
          return res.status(400).json({ message: 'Solde insuffisant pour enregistrer cette perte' });
        }
        updatedAccount.currentBalance = parseFloat(account.currentBalance) - amount;
        updatedAccount.totalLosses = parseFloat(account.totalLosses) + amount;
        break;
      case 'transfer':
        // Vérifier si le compte cible existe
        if (targetAccountId) {
          const targetAccountCheck = await pool.query('SELECT * FROM accounts WHERE id = $1', [targetAccountId]);
          if (targetAccountCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Compte cible non trouvé' });
          }

          // Vérifier si le solde est suffisant
          if (parseFloat(account.currentBalance) < amount) {
            return res.status(400).json({ message: 'Solde insuffisant pour effectuer ce transfert' });
          }

          // Mettre à jour le compte source
          updatedAccount.currentBalance = parseFloat(account.currentBalance) - amount;
          updatedAccount.totalWithdrawals = parseFloat(account.totalWithdrawals) + amount;

          // Mettre à jour le compte cible
          const targetAccount = targetAccountCheck.rows[0];
          let updatedTargetAccount = { ...targetAccount };
          
          // Si les devises sont différentes, appliquer le taux de change
          let amountToDeposit = amount;
          if (account.currency !== targetAccount.currency && exchangeRate) {
            amountToDeposit = amount * exchangeRate;
          }
          
          updatedTargetAccount.currentBalance = parseFloat(targetAccount.currentBalance) + amountToDeposit;
          updatedTargetAccount.totalDeposits = parseFloat(targetAccount.totalDeposits) + amountToDeposit;

          // Mettre à jour le compte cible dans la base de données
          await pool.query(
            `UPDATE accounts SET 
              "currentBalance" = $1, 
              "totalDeposits" = $2 
            WHERE id = $3`,
            [updatedTargetAccount.currentBalance, updatedTargetAccount.totalDeposits, targetAccountId]
          );
        } else {
          return res.status(400).json({ message: 'Compte cible requis pour un transfert' });
        }
        break;
      default:
        return res.status(400).json({ message: 'Type de transaction non valide' });
    }

    // Mettre à jour le compte source dans la base de données
    await pool.query(
      `UPDATE accounts SET 
        "currentBalance" = $1, 
        "totalDeposits" = $2, 
        "totalWithdrawals" = $3, 
        "totalProfits" = $4, 
        "totalLosses" = $5 
      WHERE id = $6`,
      [
        updatedAccount.currentBalance,
        updatedAccount.totalDeposits,
        updatedAccount.totalWithdrawals,
        updatedAccount.totalProfits,
        updatedAccount.totalLosses,
        accountId
      ]
    );

    // Insérer la transaction dans la base de données
    const transactionResult = await pool.query(
      `INSERT INTO transactions (
        id, "accountId", type, amount, date, description, currency, source, "targetAccountId", "exchangeRate"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [id, accountId, type, amount, transactionDate, description, currency, source, targetAccountId, exchangeRate]
    );
    
    // Recalculer le solde du compte source après la transaction
    const sourceBalance = await calculateAccountBalance(accountId);
    await pool.query(
      'UPDATE accounts SET "currentBalance" = $1 WHERE id = $2',
      [sourceBalance, accountId]
    );
    
    // Si c'est un transfert, recalculer aussi le solde du compte cible
    if (type === 'transfer' && targetAccountId) {
      const targetBalance = await calculateAccountBalance(targetAccountId);
      await pool.query(
        'UPDATE accounts SET "currentBalance" = $1 WHERE id = $2',
        [targetBalance, targetAccountId]
      );
    }

    res.status(201).json(transactionResult.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création de la transaction:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la transaction' });
  }
};

// Mettre à jour une transaction
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      type,
      amount,
      date,
      description,
      source,
      targetAccountId,
      exchangeRate
    } = req.body;

    // Vérifier si la transaction existe
    const checkResult = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }

    // Récupérer l'ancienne transaction pour comparer les changements
    const oldTransaction = checkResult.rows[0];
    
    // Construire la requête de mise à jour dynamiquement
    let updateQuery = 'UPDATE transactions SET ';
    const updateValues: any[] = [];
    const updateFields: string[] = [];
    let paramIndex = 1;

    if (type !== undefined) {
      updateFields.push(`type = $${paramIndex++}`);
      updateValues.push(type);
    }
    
    if (amount !== undefined) {
      updateFields.push(`amount = $${paramIndex++}`);
      updateValues.push(amount);
    }
    
    if (date !== undefined) {
      updateFields.push(`date = $${paramIndex++}`);
      updateValues.push(date);
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description);
    }
    
    if (source !== undefined) {
      updateFields.push(`source = $${paramIndex++}`);
      updateValues.push(source);
    }
    
    if (targetAccountId !== undefined) {
      updateFields.push(`"targetAccountId" = $${paramIndex++}`);
      updateValues.push(targetAccountId);
    }
    
    if (exchangeRate !== undefined) {
      updateFields.push(`"exchangeRate" = $${paramIndex++}`);
      updateValues.push(exchangeRate);
    }

    // Si aucun champ n'est à mettre à jour
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Aucun champ à mettre à jour' });
    }

    // Ajouter la condition WHERE et exécuter la requête
    updateQuery += updateFields.join(', ') + ` WHERE id = $${paramIndex} RETURNING *`;
    updateValues.push(id);

    const result = await pool.query(updateQuery, updateValues);
    const updatedTransaction = result.rows[0];
    
    // Mettre à jour les soldes des comptes si nécessaire
    // (pour une implémentation complète, il faudrait gérer les changements de montant, de type, etc.)
    // Cette implémentation simplifiée suppose que les changements n'affectent pas les soldes des comptes
    
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la transaction:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la transaction' });
  }
};

// Supprimer une transaction
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier si la transaction existe et récupérer ses détails
    const transactionCheck = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (transactionCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }

    const transaction = transactionCheck.rows[0];
    const { accountId, type, amount, targetAccountId } = transaction;

    // Récupérer les informations du compte pour la mise à jour
    const accountCheck = await pool.query('SELECT * FROM accounts WHERE id = $1', [accountId]);
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Compte non trouvé' });
    }

    const account = accountCheck.rows[0];
    let updatedAccount = { ...account };

    // Inverser les effets de la transaction sur le compte
    switch (type) {
      case 'deposit':
        updatedAccount.currentBalance = parseFloat(account.currentBalance) - amount;
        updatedAccount.totalDeposits = parseFloat(account.totalDeposits) - amount;
        break;
      case 'withdrawal':
        updatedAccount.currentBalance = parseFloat(account.currentBalance) + amount;
        updatedAccount.totalWithdrawals = parseFloat(account.totalWithdrawals) - amount;
        break;
      case 'profit':
        updatedAccount.currentBalance = parseFloat(account.currentBalance) - amount;
        updatedAccount.totalProfits = parseFloat(account.totalProfits) - amount;
        break;
      case 'loss':
        updatedAccount.currentBalance = parseFloat(account.currentBalance) + amount;
        updatedAccount.totalLosses = parseFloat(account.totalLosses) - amount;
        break;
      case 'transfer':
        // Mettre à jour le compte source
        updatedAccount.currentBalance = parseFloat(account.currentBalance) + amount;
        updatedAccount.totalWithdrawals = parseFloat(account.totalWithdrawals) - amount;

        // Mettre à jour le compte cible si nécessaire
        if (targetAccountId) {
          const targetAccountCheck = await pool.query('SELECT * FROM accounts WHERE id = $1', [targetAccountId]);
          if (targetAccountCheck.rows.length > 0) {
            const targetAccount = targetAccountCheck.rows[0];
            let updatedTargetAccount = { ...targetAccount };
            
            // Si les devises sont différentes, appliquer le taux de change
            let amountToRemove = amount;
            if (account.currency !== targetAccount.currency && transaction.exchangeRate) {
              amountToRemove = amount * transaction.exchangeRate;
            }
            
            updatedTargetAccount.currentBalance = parseFloat(targetAccount.currentBalance) - amountToRemove;
            updatedTargetAccount.totalDeposits = parseFloat(targetAccount.totalDeposits) - amountToRemove;

            // Mettre à jour le compte cible dans la base de données
            await pool.query(
              `UPDATE accounts SET 
                "currentBalance" = $1, 
                "totalDeposits" = $2 
              WHERE id = $3`,
              [updatedTargetAccount.currentBalance, updatedTargetAccount.totalDeposits, targetAccountId]
            );
          }
        }
        break;
    }

    // Mettre à jour le compte source dans la base de données
    await pool.query(
      `UPDATE accounts SET 
        "currentBalance" = $1, 
        "totalDeposits" = $2, 
        "totalWithdrawals" = $3, 
        "totalProfits" = $4, 
        "totalLosses" = $5 
      WHERE id = $6`,
      [
        updatedAccount.currentBalance,
        updatedAccount.totalDeposits,
        updatedAccount.totalWithdrawals,
        updatedAccount.totalProfits,
        updatedAccount.totalLosses,
        accountId
      ]
    );

    // Supprimer la transaction
    await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
    
    // Recalculer le solde du compte source après la suppression
    const sourceBalance = await calculateAccountBalance(accountId);
    await pool.query(
      'UPDATE accounts SET "currentBalance" = $1 WHERE id = $2',
      [sourceBalance, accountId]
    );
    
    // Si c'était un transfert, recalculer aussi le solde du compte cible
    if (type === 'transfer' && targetAccountId) {
      const targetBalance = await calculateAccountBalance(targetAccountId);
      await pool.query(
        'UPDATE accounts SET "currentBalance" = $1 WHERE id = $2',
        [targetBalance, targetAccountId]
      );
    }
    
    res.json({ message: 'Transaction supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la transaction:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la transaction' });
  }
};
