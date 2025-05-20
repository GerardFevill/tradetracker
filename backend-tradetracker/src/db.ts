import { Pool } from 'pg';

export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tradetracker',
  password: 'yourpassword',
  port: 5432,
});
