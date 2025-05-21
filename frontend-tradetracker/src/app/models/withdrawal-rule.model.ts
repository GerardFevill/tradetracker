import { Currency } from './account.model';

/**
 * Représente une plage de capital avec des règles de retrait spécifiques
 */
export interface CapitalRange {
  minAmount: number;  // Montant minimum de la plage
  maxAmount: number;  // Montant maximum de la plage
  withdrawalRules: WithdrawalRule[];  // Règles de retrait pour cette plage
}

/**
 * Règle de retrait basée sur le pourcentage d'objectif atteint
 */
export interface WithdrawalRule {
  targetPercentage: number;  // Pourcentage de l'objectif atteint (20%, 40%, 60%, etc.)
  profitPercentageToWithdraw: number;  // Pourcentage du profit à retirer
}

/**
 * Configuration complète des règles de retrait pour une devise
 */
export interface WithdrawalRuleSet {
  currency: Currency;  // USD ou EUR
  capitalRanges: CapitalRange[];  // Différentes plages de capital
}

/**
 * Recommandation de retrait calculée
 */
export interface WithdrawalRecommendation {
  accountId: string;
  currentBalance: number;
  targetBalance: number;
  progressPercentage: number;
  recommendedAmount: number;
  remainingBalance: number;
  appliedRule: WithdrawalRule;
  appliedRange: CapitalRange;
}
