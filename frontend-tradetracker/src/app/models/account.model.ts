export type Currency = 'USD' | 'EUR';
export type Broker = 'Roboforex' | 'IC Markets' | 'Other';

export interface Account {
  id: string;
  name: string;
  broker: Broker;
  currency: Currency;
  currentBalance: number;
  targetBalance: number;
  withdrawalThreshold: number;
  initialCapital: number; // Capital initial fourni par l'utilisateur
  totalDeposits: number;
  totalWithdrawals: number;
  totalProfits: number;
  totalLosses: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AccountSummary {
  totalAccounts: number;
  totalBalanceUSD: number;
  totalBalanceEUR: number;
  totalTargetUSD: number;
  totalTargetEUR: number;
  performanceUSD: number; // Percentage
  performanceEUR: number; // Percentage
}

// Modèle pour les étapes du plan de retrait fixe
export interface WithdrawalStep {
  percentGoal: number;      // Pourcentage de l'objectif atteint
  withdrawalRate: number;   // Taux de retrait des profits
}

// Interface étendue pour les comptes avec informations de retrait calculées
export interface AccountWithWithdrawalInfo extends Account {
  recommendedWithdrawal: number;  // Montant de retrait recommandé
  withdrawalRate: number;         // Taux de retrait applicable
  percentGoal: number;           // Palier atteint dans le plan de retrait
}

// Modèle pour les alertes de retrait
export interface WithdrawalAlert {
  accountId: string;
  accountName: string;
  level: number;           // Niveau atteint (percentGoal)
  profit: number;          // Montant du profit
  withdrawalAmount: number; // Montant à retirer
  currency: Currency;      // Devise du compte
  date: Date;              // Date de l'alerte
}
