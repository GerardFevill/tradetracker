import express from 'express';
import {
  getTransactions,
  getTransactionsByAccount,
  getTransactionById,
  getTransactionsByType,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../controllers/transaction.controller';

const router = express.Router();

// Routes pour les transactions
router.get('/', getTransactions);
router.get('/account/:accountId', getTransactionsByAccount);
router.get('/type/:type', getTransactionsByType);
router.get('/:id', getTransactionById);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
