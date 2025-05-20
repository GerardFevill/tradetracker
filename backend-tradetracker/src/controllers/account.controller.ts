import { Request, Response } from 'express';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';

export const getAccounts = async (_req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM accounts');
  res.json(result.rows);
};

export const addAccount = async (req: Request, res: Response) => {
  const id = uuidv4();
  const {
    broker, currency, current_balance,
    target_balance, withdraw_threshold,
    total_deposits, total_withdrawals
  } = req.body;

  await pool.query(
    'INSERT INTO accounts VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [id, broker, currency, current_balance, target_balance, withdraw_threshold, total_deposits, total_withdrawals]
  );

  res.json({ message: 'Account created', id });
};
