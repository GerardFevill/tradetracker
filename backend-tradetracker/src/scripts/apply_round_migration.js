const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Créer une instance de Pool avec les paramètres de connexion
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function applyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Début de la migration pour arrondir les valeurs numériques...');
    
    // Lire le fichier SQL de migration
    const migrationPath = path.resolve(__dirname, '../migrations/round_numeric_values.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Exécuter la migration
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('Migration appliquée avec succès!');
    console.log('Toutes les valeurs numériques sont maintenant arrondies à deux décimales.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de l\'application de la migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter la migration
applyMigration().catch(err => {
  console.error('Échec de la migration:', err);
  process.exit(1);
});
