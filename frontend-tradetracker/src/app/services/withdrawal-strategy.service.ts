import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { CapitalRange, WithdrawalRule, WithdrawalRuleSet, WithdrawalRecommendation } from '../models/withdrawal-rule.model';
import { Account, Currency } from '../models/account.model';
import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root'
})
export class WithdrawalStrategyService {
  private withdrawalRuleSets: WithdrawalRuleSet[] = [];
  private withdrawalRuleSetsSubject = new BehaviorSubject<WithdrawalRuleSet[]>([]);
  
  constructor(private accountService: AccountService) {
    // Initialiser avec les règles par défaut
    this.initDefaultRules();
  }
  
  /**
   * Initialise les règles de retrait par défaut basées sur la stratégie fournie
   */
  private initDefaultRules(): void {
    // Règles pour USD
    const usdRules: WithdrawalRuleSet = {
      currency: 'USD',
      capitalRanges: [
        // Plage 100$ - 1 000$
        {
          minAmount: 100,
          maxAmount: 1000,
          withdrawalRules: [
            { targetPercentage: 20, profitPercentageToWithdraw: 10 },
            { targetPercentage: 40, profitPercentageToWithdraw: 15 },
            { targetPercentage: 60, profitPercentageToWithdraw: 20 },
            { targetPercentage: 80, profitPercentageToWithdraw: 25 },
            { targetPercentage: 90, profitPercentageToWithdraw: 30 },
            { targetPercentage: 100, profitPercentageToWithdraw: 33 }
          ]
        },
        // Plage 1 000$ - 10 000$
        {
          minAmount: 1000,
          maxAmount: 10000,
          withdrawalRules: [
            { targetPercentage: 20, profitPercentageToWithdraw: 10 },
            { targetPercentage: 40, profitPercentageToWithdraw: 15 },
            { targetPercentage: 60, profitPercentageToWithdraw: 20 },
            { targetPercentage: 80, profitPercentageToWithdraw: 25 },
            { targetPercentage: 90, profitPercentageToWithdraw: 30 },
            { targetPercentage: 100, profitPercentageToWithdraw: 33 }
          ]
        },
        // Plage 10 000$ - 100 000$ (version agressive)
        {
          minAmount: 10000,
          maxAmount: 100000,
          withdrawalRules: [
            { targetPercentage: 20, profitPercentageToWithdraw: 15 },
            { targetPercentage: 40, profitPercentageToWithdraw: 25 },
            { targetPercentage: 60, profitPercentageToWithdraw: 30 },
            { targetPercentage: 80, profitPercentageToWithdraw: 35 },
            { targetPercentage: 90, profitPercentageToWithdraw: 40 },
            { targetPercentage: 100, profitPercentageToWithdraw: 50 }
          ]
        },
        // Plage 100 000$ - 1 000 000$ (version très agressive)
        {
          minAmount: 100000,
          maxAmount: 1000000,
          withdrawalRules: [
            { targetPercentage: 20, profitPercentageToWithdraw: 20 },
            { targetPercentage: 40, profitPercentageToWithdraw: 30 },
            { targetPercentage: 60, profitPercentageToWithdraw: 35 },
            { targetPercentage: 80, profitPercentageToWithdraw: 40 },
            { targetPercentage: 90, profitPercentageToWithdraw: 50 },
            { targetPercentage: 100, profitPercentageToWithdraw: 60 }
          ]
        }
      ]
    };
    
    // Règles pour EUR (mêmes pourcentages que pour USD)
    const eurRules: WithdrawalRuleSet = {
      currency: 'EUR',
      capitalRanges: JSON.parse(JSON.stringify(usdRules.capitalRanges)) // Copie profonde
    };
    
    this.withdrawalRuleSets = [usdRules, eurRules];
    this.withdrawalRuleSetsSubject.next(this.withdrawalRuleSets);
  }
  
  /**
   * Calcule la recommandation de retrait pour un compte spécifique
   */
  calculateWithdrawalRecommendation(account: Account): WithdrawalRecommendation | null {
    if (!account) return null;
    
    // Trouver le jeu de règles correspondant à la devise du compte
    const ruleSet = this.withdrawalRuleSets.find(rs => rs.currency === account.currency);
    if (!ruleSet) return null;
    
    // Calculer le pourcentage de progression vers l'objectif
    const progressPercentage = (account.currentBalance / account.targetBalance) * 100;
    
    // Trouver la plage de capital applicable
    const applicableRange = ruleSet.capitalRanges.find(range => 
      account.targetBalance >= range.minAmount && account.targetBalance <= range.maxAmount
    );
    
    if (!applicableRange) return null;
    
    // Trouver la règle applicable en fonction du pourcentage d'objectif atteint
    let applicableRule: WithdrawalRule | undefined;
    for (let i = applicableRange.withdrawalRules.length - 1; i >= 0; i--) {
      if (progressPercentage >= applicableRange.withdrawalRules[i].targetPercentage) {
        applicableRule = applicableRange.withdrawalRules[i];
        break;
      }
    }
    
    if (!applicableRule) return null;
    
    // Calculer le profit (différence entre le solde actuel et tous les dépôts)
    // Tous les dépôts sont considérés comme du capital investi, pas comme des gains
    const totalInvested = account.totalDeposits;
    const profit = account.currentBalance - totalInvested;
    
    if (profit <= 0) return null; // Pas de profit, pas de retrait recommandé
    
    // Calculer le montant recommandé à retirer
    const recommendedAmount = profit * (applicableRule.profitPercentageToWithdraw / 100);
    const remainingBalance = account.currentBalance - recommendedAmount;
    
    return {
      accountId: account.id,
      currentBalance: account.currentBalance,
      targetBalance: account.targetBalance,
      progressPercentage,
      recommendedAmount,
      remainingBalance,
      appliedRule: applicableRule,
      appliedRange: applicableRange
    };
  }
  
  /**
   * Obtient la recommandation de retrait pour un compte spécifique
   */
  getWithdrawalRecommendation(accountOrId: string | Account): Observable<WithdrawalRecommendation | null> {
    // Si un objet Account est passé directement, on l'utilise
    if (typeof accountOrId !== 'string') {
      return of(this.calculateWithdrawalRecommendation(accountOrId));
    }
    
    // Sinon, on récupère le compte à partir de son ID
    return this.accountService.getAccountById(accountOrId).pipe(
      map(account => account ? this.calculateWithdrawalRecommendation(account) : null)
    );
  }
  
  /**
   * Obtient toutes les règles de retrait
   */
  getWithdrawalRuleSets(): Observable<WithdrawalRuleSet[]> {
    return this.withdrawalRuleSetsSubject.asObservable();
  }
  
  /**
   * Met à jour les règles de retrait
   */
  updateWithdrawalRuleSets(ruleSets: WithdrawalRuleSet[]): void {
    this.withdrawalRuleSets = ruleSets;
    this.withdrawalRuleSetsSubject.next(this.withdrawalRuleSets);
  }
}
