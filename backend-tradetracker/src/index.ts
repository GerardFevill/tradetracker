import express from 'express';
import cors from 'cors';
import accountRoutes from './routes/account.routes';
import transactionRoutes from './routes/transaction.routes';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);

app.listen(3000, () => console.log('Server is running on http://localhost:3000'));
