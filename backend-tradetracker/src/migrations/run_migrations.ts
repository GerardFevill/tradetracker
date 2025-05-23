import { pool } from '../db';
import * as fs from 'fs';
import * as path from 'path';

// Fonction pour exécuter une migration SQL
async function executeSqlFile(filePath: string): Promise<void> {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Exécution du fichier SQL: ${filePath}`);
    await pool.query(sql);
    console.log(`Migration réussie: ${filePath}`);
  } catch (error) {
    console.error(`Erreur lors de l'exécution de la migration ${filePath}:`, error);
    throw error;
  }
}

// Fonction principale pour exécuter toutes les migrations
async function runMigrations(): Promise<void> {
  try {
    console.log('Démarrage des migrations...');
    
    // Exécuter la migration pour ajouter la colonne isActive
    await executeSqlFile(path.join(__dirname, 'add_is_active_column.sql'));
    
    console.log('Toutes les migrations ont été exécutées avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'exécution des migrations:', error);
    process.exit(1);
  } finally {
    // Fermer la connexion à la base de données
    await pool.end();
  }
}

// Exécuter les migrations
runMigrations();
