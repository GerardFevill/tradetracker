import express from 'express';
import { getAccounts, addAccount } from '../controllers/account.controller';

const router = express.Router();

router.get('/', getAccounts);
router.post('/', addAccount);

export default router;
