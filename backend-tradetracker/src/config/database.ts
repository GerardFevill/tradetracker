import { Pool } from 'pg';

// Configuration de la connexion à PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'tradetracker',
  password: process.env.DB_PASSWORD || 'tradetracker',
  database: process.env.DB_NAME || 'tradetracker',
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

export default pool;
