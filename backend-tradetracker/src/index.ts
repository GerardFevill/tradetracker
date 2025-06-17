import dotenv from 'dotenv';

// Charger les variables d'environnement
// Le fichier .env.local aura priorité s'il existe (comportement par défaut de dotenv)
dotenv.config();

import express from 'express';
import cors from 'cors';
import accountRoutes from './routes/account.routes';
import transactionRoutes from './routes/transaction.routes';
import analyticsRoutes from './routes/analytics.routes';
import { testConnection } from './db';

const app = express();
app.use(cors());
app.use(express.json());

// Définir les routes de l'API
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);

// Route de statut pour vérifier si le serveur est en ligne
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Récupérer le port depuis les variables d'environnement ou utiliser 3000 par défaut
const PORT = process.env.PORT || 3000;
console.log(`Port configuré: ${PORT}`);


// Démarrer le serveur
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  
  // Tester la connexion à la base de données
  await testConnection();
});
