import { Request, Response } from 'express';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';

export const getTransactions = async (_req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM transactions');
  res.json(result.rows);
};

export const addTransaction = async (req: Request, res: Response) => {
  const id = uuidv4();
  const { account_id, type, amount, date, comment } = req.body;

  await pool.query(
    'INSERT INTO transactions VALUES ($1, $2, $3, $4, $5, $6)',
    [id, account_id, type, amount, date, comment]
  );

  res.json({ message: 'Transaction created', id });
};
