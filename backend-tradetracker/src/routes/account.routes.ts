import express from 'express';
import {
  getAccounts,
  getAccountById,
  getAccountsByBroker,
  getAccountsByCurrency,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountSummary,
  recalculateAccountBalance,
  recalculateAllAccountsBalances
} from '../controllers/account.controller';

const router = express.Router();

// Routes pour les comptes
router.get('/', getAccounts);
router.get('/summary', getAccountSummary);
router.get('/broker/:broker', getAccountsByBroker);
router.get('/currency/:currency', getAccountsByCurrency);
router.get('/:id', getAccountById);
router.post('/', createAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

// Routes pour le recalcul des soldes
router.post('/recalculate-all-balances', recalculateAllAccountsBalances);
router.post('/:id/recalculate-balance', recalculateAccountBalance);

export default router;
