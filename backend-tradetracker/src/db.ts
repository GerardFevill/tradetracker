import { Pool } from 'pg';

export const pool = new Pool({
  user: process.env.DB_USER || 'tradetracker',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tradetracker',
  password: process.env.DB_PASSWORD || 'tradetracker',
  port: parseInt(process.env.DB_PORT || '7432'),
});

// Fonction pour tester la connexion à la base de données
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    console.log('Connexion à la base de données PostgreSQL établie avec succès');
    client.release();
    return true;
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    return false;
  }
};
