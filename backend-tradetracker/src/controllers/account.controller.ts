import { Request, Response } from 'express';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Account, AccountSummary } from '../models/account.model';
import { calculateAccountBalance } from '../utils/balance-calculator';
import { formatAccountNumbers, formatAccountsArray, roundToTwoDecimals } from '../utils/number-formatter';

// Récupérer tous les comptes
export const getAccounts = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM accounts');
    // Formater les nombres à deux décimales
    const formattedAccounts = formatAccountsArray(result.rows);
    res.json(formattedAccounts);
  } catch (error) {
    console.error('Erreur lors de la récupération des comptes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des comptes' });
  }
};

// Récupérer un compte par son ID
export const getAccountById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM accounts WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Compte non trouvé' });
    }
    
    // Formater les nombres à deux décimales
    const formattedAccount = formatAccountNumbers(result.rows[0]);
    res.json(formattedAccount);
  } catch (error) {
    console.error('Erreur lors de la récupération du compte:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du compte' });
  }
};

// Récupérer les comptes par broker
export const getAccountsByBroker = async (req: Request, res: Response) => {
  try {
    const { broker } = req.params;
    const result = await pool.query('SELECT * FROM accounts WHERE broker = $1', [broker]);
    // Formater les nombres à deux décimales
    const formattedAccounts = formatAccountsArray(result.rows);
    res.json(formattedAccounts);
  } catch (error) {
    console.error('Erreur lors de la récupération des comptes par broker:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des comptes par broker' });
  }
};

// Récupérer les comptes par devise
export const getAccountsByCurrency = async (req: Request, res: Response) => {
  try {
    const { currency } = req.params;
    const result = await pool.query('SELECT * FROM accounts WHERE currency = $1', [currency]);
    // Formater les nombres à deux décimales
    const formattedAccounts = formatAccountsArray(result.rows);
    res.json(formattedAccounts);
  } catch (error) {
    console.error('Erreur lors de la récupération des comptes par devise:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des comptes par devise' });
  }
};

// Créer un nouveau compte
export const createAccount = async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    const {
      name,
      broker,
      currency,
      currentBalance,
      initialCapital, // Nouveau champ pour le capital initial
      targetBalance,
      withdrawalThreshold,
      totalDeposits,
      totalWithdrawals,
      totalProfits,
      totalLosses,
      isActive = true // Par défaut, les nouveaux comptes sont actifs
    } = req.body;

    const now = new Date();

    // Arrondir toutes les valeurs numériques à deux décimales
    const roundedCurrentBalance = roundToTwoDecimals(currentBalance || 0);
    const roundedInitialCapital = roundToTwoDecimals(initialCapital || roundedCurrentBalance); // Par défaut, utiliser le solde actuel
    const roundedTargetBalance = roundToTwoDecimals(targetBalance || 0);
    const roundedWithdrawalThreshold = roundToTwoDecimals(withdrawalThreshold || 0);
    const roundedTotalDeposits = roundToTwoDecimals(totalDeposits || 0);
    const roundedTotalWithdrawals = roundToTwoDecimals(totalWithdrawals || 0);
    const roundedTotalProfits = roundToTwoDecimals(totalProfits || 0);
    const roundedTotalLosses = roundToTwoDecimals(totalLosses || 0);

    const result = await pool.query(
      `INSERT INTO accounts (
        id, name, broker, currency, "currentBalance", "initialCapital", "targetBalance", 
        "withdrawalThreshold", "totalDeposits", "totalWithdrawals", 
        "totalProfits", "totalLosses", "createdAt", "updatedAt", "isActive"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        id,
        name,
        broker,
        currency,
        roundedCurrentBalance,
        roundedInitialCapital,
        roundedTargetBalance,
        roundedWithdrawalThreshold,
        roundedTotalDeposits,
        roundedTotalWithdrawals,
        roundedTotalProfits,
        roundedTotalLosses,
        now,
        now,
        isActive
      ]
    );

    // Formater les nombres à deux décimales dans la réponse
    const formattedAccount = formatAccountNumbers(result.rows[0]);
    res.status(201).json(formattedAccount);
  } catch (error) {
    console.error('Erreur lors de la création du compte:', error);
    res.status(500).json({ message: 'Erreur lors de la création du compte' });
  }
};

// Mettre à jour un compte
export const updateAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      broker,
      currency,
      currentBalance,
      initialCapital, // Nouveau champ pour le capital initial
      targetBalance,
      withdrawalThreshold,
      totalDeposits,
      totalWithdrawals,
      totalProfits,
      totalLosses,
      isActive
    } = req.body;

    // Vérifier si le compte existe
    const checkResult = await pool.query('SELECT * FROM accounts WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Compte non trouvé' });
    }

    // Construire la requête de mise à jour dynamiquement
    let updateQuery = 'UPDATE accounts SET ';
    const updateValues: any[] = [];
    const updateFields: string[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }
    if (broker !== undefined) {
      updateFields.push(`broker = $${paramIndex++}`);
      updateValues.push(broker);
    }
    if (currency !== undefined) {
      updateFields.push(`currency = $${paramIndex++}`);
      updateValues.push(currency);
    }
    if (currentBalance !== undefined) {
      updateFields.push(`"currentBalance" = $${paramIndex++}`);
      updateValues.push(roundToTwoDecimals(currentBalance));
    }
    if (initialCapital !== undefined) {
      updateFields.push(`"initialCapital" = $${paramIndex++}`);
      updateValues.push(roundToTwoDecimals(initialCapital));
    }
    if (targetBalance !== undefined) {
      updateFields.push(`"targetBalance" = $${paramIndex++}`);
      updateValues.push(roundToTwoDecimals(targetBalance));
    }
    if (withdrawalThreshold !== undefined) {
      updateFields.push(`"withdrawalThreshold" = $${paramIndex++}`);
      updateValues.push(roundToTwoDecimals(withdrawalThreshold));
    }
    if (totalDeposits !== undefined) {
      updateFields.push(`"totalDeposits" = $${paramIndex++}`);
      updateValues.push(roundToTwoDecimals(totalDeposits));
    }
    if (totalWithdrawals !== undefined) {
      updateFields.push(`"totalWithdrawals" = $${paramIndex++}`);
      updateValues.push(roundToTwoDecimals(totalWithdrawals));
    }
    if (totalProfits !== undefined) {
      updateFields.push(`"totalProfits" = $${paramIndex++}`);
      updateValues.push(roundToTwoDecimals(totalProfits));
    }
    if (totalLosses !== undefined) {
      updateFields.push(`"totalLosses" = $${paramIndex++}`);
      updateValues.push(roundToTwoDecimals(totalLosses));
    }
    if (isActive !== undefined) {
      updateFields.push(`"isActive" = $${paramIndex++}`);
      updateValues.push(isActive);
    }

    // Si aucun champ n'est à mettre à jour
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Aucun champ à mettre à jour' });
    }

    // Ajouter la date de mise à jour
    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    updateValues.push(new Date());

    // Ajouter la condition WHERE et exécuter la requête
    updateQuery += updateFields.join(', ') + ` WHERE id = $${paramIndex} RETURNING *`;
    updateValues.push(id);

    const result = await pool.query(updateQuery, updateValues);
    
    // Formater les nombres à deux décimales dans la réponse
    const formattedAccount = formatAccountNumbers(result.rows[0]);
    res.json(formattedAccount);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du compte:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du compte' });
  }
};

// Supprimer un compte
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier si le compte existe
    const checkResult = await pool.query('SELECT * FROM accounts WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Compte non trouvé' });
    }

    await pool.query('DELETE FROM accounts WHERE id = $1', [id]);
    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du compte' });
  }
};

// Recalculer et mettre à jour le solde d'un compte
export const recalculateAccountBalance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Vérifier si le compte existe
    const checkResult = await pool.query('SELECT * FROM accounts WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Compte non trouvé' });
    }
    
    // Calculer le solde à partir des transactions
    const calculatedBalance = await calculateAccountBalance(id);
    
    // Mettre à jour le solde du compte
    const updateResult = await pool.query(
      'UPDATE accounts SET "currentBalance" = $1 WHERE id = $2 RETURNING *',
      [calculatedBalance, id]
    );
    
    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erreur lors du recalcul du solde du compte:', error);
    res.status(500).json({ message: 'Erreur lors du recalcul du solde du compte' });
  }
};

// Recalculer et mettre à jour le solde de tous les comptes
export const recalculateAllAccountsBalances = async (_req: Request, res: Response) => {
  try {
    // Récupérer tous les comptes
    const accountsResult = await pool.query('SELECT id FROM accounts');
    const accounts = accountsResult.rows;
    
    // Recalculer le solde pour chaque compte
    const updatedAccounts = [];
    for (const account of accounts) {
      const calculatedBalance = await calculateAccountBalance(account.id);
      
      // Mettre à jour le solde du compte
      const updateResult = await pool.query(
        'UPDATE accounts SET "currentBalance" = $1 WHERE id = $2 RETURNING *',
        [calculatedBalance, account.id]
      );
      
      updatedAccounts.push(updateResult.rows[0]);
    }
    
    res.json({
      message: `Soldes recalculés pour ${updatedAccounts.length} comptes`,
      accounts: updatedAccounts
    });
  } catch (error) {
    console.error('Erreur lors du recalcul des soldes des comptes:', error);
    res.status(500).json({ message: 'Erreur lors du recalcul des soldes des comptes' });
  }
};

// Récupérer le résumé des comptes
export const getAccountSummary = async (_req: Request, res: Response) => {
  try {
    // Récupérer tous les comptes
    const accountsResult = await pool.query('SELECT * FROM accounts');
    const accounts = accountsResult.rows;

    // Filtrer les comptes par devise
    const usdAccounts = accounts.filter(account => account.currency === 'USD');
    const eurAccounts = accounts.filter(account => account.currency === 'EUR');

    // Calculer les totaux
    const totalBalanceUSD = usdAccounts.reduce((sum, account) => sum + parseFloat(account.currentBalance), 0);
    const totalBalanceEUR = eurAccounts.reduce((sum, account) => sum + parseFloat(account.currentBalance), 0);
    
    const totalTargetUSD = usdAccounts.reduce((sum, account) => sum + parseFloat(account.targetBalance), 0);
    const totalTargetEUR = eurAccounts.reduce((sum, account) => sum + parseFloat(account.targetBalance), 0);
    
    const performanceUSD = totalTargetUSD > 0 ? (totalBalanceUSD / totalTargetUSD) * 100 : 0;
    const performanceEUR = totalTargetEUR > 0 ? (totalBalanceEUR / totalTargetEUR) * 100 : 0;

    const summary: AccountSummary = {
      totalAccounts: accounts.length,
      totalBalanceUSD,
      totalBalanceEUR,
      totalTargetUSD,
      totalTargetEUR,
      performanceUSD,
      performanceEUR
    };

    res.json(summary);
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé des comptes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du résumé des comptes' });
  }
};
