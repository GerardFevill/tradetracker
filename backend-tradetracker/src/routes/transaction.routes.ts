import express from 'express';
import { getTransactions, addTransaction } from '../controllers/transaction.controller';

const router = express.Router();

router.get('/', getTransactions);
router.post('/', addTransaction);

export default router;
