import { Injectable } from '@angular/core';
import { Observable, of, map } from 'rxjs';
import { AccountService } from './account.service';
import { Account, WithdrawalStep, WithdrawalAlert } from '../models/account.model';

@Injectable({
  providedIn: 'root'
})
export class WithdrawalPlanService {
  // Plan de retrait fixe commun à tous les comptes
  private withdrawalPlan: WithdrawalStep[] = [
    { percentGoal: 20, withdrawalRate: 0.15 },
    { percentGoal: 40, withdrawalRate: 0.25 },
    { percentGoal: 60, withdrawalRate: 0.30 },
    { percentGoal: 80, withdrawalRate: 0.35 },
    { percentGoal: 90, withdrawalRate: 0.40 },
    { percentGoal: 100, withdrawalRate: 0.50 },
  ];

  constructor(private accountService: AccountService) {}

  /**
   * Retourne le plan de retrait fixe
   * @returns Le plan de retrait fixe
   */
  getWithdrawalPlan(): WithdrawalStep[] {
    return [...this.withdrawalPlan];
  }

  /**
   * Vérifie si un compte a atteint un niveau du plan de retrait
   * @param account Le compte à vérifier
   * @returns Une alerte de retrait si un niveau est atteint, null sinon
   */
  checkWithdrawalAlert(account: Account): WithdrawalAlert | null {
    // Vérifier que le compte a un capital initial défini
    if (!account.initialCapital || account.initialCapital <= 0) {
      console.log('Compte ' + account.name + ' sans capital initial valide');
      return null;
    }

    // Vérifier que le compte a un objectif défini
    if (!account.targetBalance || account.targetBalance <= account.initialCapital) {
      console.log('Compte ' + account.name + ' sans objectif valide');
      return null;
    }

    // Calculer le profit net
    const profit = account.currentBalance - account.initialCapital;
    
    // Si pas de profit, pas d'alerte
    if (profit <= 0) {
      console.log('Compte ' + account.name + ' sans profit (' + profit + ')');
      return null;
    }

    console.log('Analyse du plan de retrait pour ' + account.name + ': Capital initial ' + account.initialCapital + ', Solde actuel ' + account.currentBalance + ', Profit ' + profit);

    // Parcourir le plan de retrait du plus élevé au plus bas pour trouver le niveau atteint
    for (let i = this.withdrawalPlan.length - 1; i >= 0; i--) {
      const step = this.withdrawalPlan[i];
      
      // Calculer le seuil de capital pour ce niveau (capital initial + pourcentage d'augmentation)
      const levelThreshold = account.initialCapital * (1 + step.percentGoal / 100);
      
      console.log('Vérification niveau ' + step.percentGoal + '%: Seuil ' + levelThreshold + ' ' + account.currency);
      
      // Vérifier si le solde actuel a atteint ce niveau
      if (account.currentBalance >= levelThreshold) {
        // Calculer le montant maximum qui peut être retiré selon le taux de retrait pour ce niveau
        const maxWithdrawal = profit * step.withdrawalRate;
        
        // Vérifier si un retrait est encore possible (retraits totaux inférieurs au maximum autorisé)
        if (account.totalWithdrawals < maxWithdrawal) {
          // Calculer le montant à retirer (différence entre le maximum autorisé et les retraits déjà effectués)
          const withdrawalAmount = Math.max(0, maxWithdrawal - account.totalWithdrawals);
          
          // Si le montant à retirer est trop petit, ne pas créer d'alerte
          if (withdrawalAmount < 1) {
            console.log('Montant de retrait trop faible: ' + withdrawalAmount + ' ' + account.currency);
            return null;
          }
          
          // Arrondir le montant à deux décimales
          const roundedWithdrawalAmount = Math.round(withdrawalAmount * 100) / 100;
          
          console.log('Alerte de retrait pour ' + account.name + ': Niveau ' + step.percentGoal + '%, Profit: ' + profit + ', Montant max: ' + maxWithdrawal + ', Retraits actuels: ' + account.totalWithdrawals + ', Montant disponible: ' + roundedWithdrawalAmount + ' ' + account.currency);
          
          // Créer et retourner l'alerte de retrait
          return {
            accountId: account.id,
            accountName: account.name,
            level: step.percentGoal,
            profit: Math.round(profit * 100) / 100,
            withdrawalAmount: roundedWithdrawalAmount,
            currency: account.currency,
            date: new Date()
          };
        } else {
          console.log('Niveau ' + step.percentGoal + '% atteint mais retraits déjà effectués: ' + account.totalWithdrawals + ' >= ' + maxWithdrawal);
        }
      } else {
        console.log('Niveau ' + step.percentGoal + '% non atteint: ' + account.currentBalance + ' < ' + levelThreshold);
      }
    }

    // Aucun niveau atteint
    console.log('Aucun niveau atteint pour le compte ' + account.name);
    return null;
  }

  /**
   * Vérifie tous les comptes actifs et retourne les alertes de retrait
   * @returns Un Observable contenant un tableau d'alertes de retrait
   */
  checkAllAccountsForWithdrawalAlerts(): Observable<WithdrawalAlert[]> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const alerts: WithdrawalAlert[] = [];
        
        // Filtrer les comptes actifs
        const activeAccounts = accounts.filter(account => account.isActive);
        
        // Vérifier chaque compte actif
        activeAccounts.forEach(account => {
          const alert = this.checkWithdrawalAlert(account);
          if (alert) {
            alerts.push(alert);
          }
        });
        
        return alerts;
      })
    );
  }

  /**
   * Calcule la progression vers le prochain niveau du plan de retrait
   * @param account Le compte à analyser
   * @returns Un objet contenant le niveau actuel, le niveau suivant et le pourcentage de progression
   */
  getProgressToNextLevel(account: Account): { 
    currentLevel: number, 
    nextLevel: number, 
    progressPercent: number 
  } {
    // Vérifier que le compte a un capital initial défini
    if (!account.initialCapital || account.initialCapital <= 0) {
      console.log('Compte ' + account.name + ': Impossible de calculer la progression - capital initial non défini');
      return { currentLevel: 0, nextLevel: 20, progressPercent: 0 };
    }

    // Vérifier que le compte a un objectif défini et supérieur au capital initial
    if (!account.targetBalance || account.targetBalance <= account.initialCapital) {
      console.log('Compte ' + account.name + ': Objectif invalide - doit être supérieur au capital initial');
      return { currentLevel: 0, nextLevel: 20, progressPercent: 0 };
    }

    // Calculer le profit actuel
    const currentProfit = account.currentBalance - account.initialCapital;
    
    console.log('Compte ' + account.name + ': Capital initial = ' + account.initialCapital + ', Solde actuel = ' + account.currentBalance + ', Profit = ' + currentProfit);
    
    // Si pas de profit, retourner les valeurs par défaut
    if (currentProfit <= 0) {
      console.log('Compte ' + account.name + ': Pas de profit, impossible de calculer la progression');
      return { currentLevel: 0, nextLevel: 20, progressPercent: 0 };
    }
    
    // Trouver le niveau actuel et le niveau suivant
    let currentLevel = 0;
    let nextLevel = this.withdrawalPlan[0].percentGoal;
    
    // Parcourir le plan de retrait pour trouver le niveau actuel
    for (let i = this.withdrawalPlan.length - 1; i >= 0; i--) {
      const step = this.withdrawalPlan[i];
      
      // Calculer le seuil de capital pour ce niveau
      const levelThreshold = account.initialCapital * (1 + step.percentGoal / 100);
      
      // Vérifier si le solde actuel a atteint ce niveau
      if (account.currentBalance >= levelThreshold) {
        currentLevel = step.percentGoal;
        
        // Déterminer le prochain niveau
        if (i < this.withdrawalPlan.length - 1) {
          nextLevel = this.withdrawalPlan[i + 1].percentGoal;
        } else {
          // Déjà au niveau maximum
          nextLevel = currentLevel;
        }
        
        break;
      }
    }
    
    // Si aucun niveau n'a été atteint, le niveau actuel est 0 et le prochain est le premier du plan
    if (currentLevel === 0) {
      nextLevel = this.withdrawalPlan[0].percentGoal;
    }
    
    // Calculer la progression vers le niveau suivant
    let progressPercent = 0;
    
    if (currentLevel < this.withdrawalPlan[this.withdrawalPlan.length - 1].percentGoal) {
      // Trouver l'index du niveau actuel et du niveau suivant
      const currentLevelIndex = this.withdrawalPlan.findIndex(step => step.percentGoal === currentLevel);
      const nextLevelIndex = currentLevelIndex === -1 ? 0 : currentLevelIndex + 1;
      
      if (nextLevelIndex < this.withdrawalPlan.length) {
        // Calculer les seuils de capital pour le niveau actuel et le niveau suivant
        const currentLevelThreshold = currentLevel === 0 ? 
                                     account.initialCapital : 
                                     account.initialCapital * (1 + currentLevel / 100);
                                     
        const nextLevelThreshold = account.initialCapital * (1 + this.withdrawalPlan[nextLevelIndex].percentGoal / 100);
        
        // Calculer la progression entre les deux seuils
        progressPercent = ((account.currentBalance - currentLevelThreshold) / 
                          (nextLevelThreshold - currentLevelThreshold)) * 100;
        
        // Limiter entre 0 et 100
        progressPercent = Math.max(0, Math.min(100, progressPercent));
        
        console.log('Compte ' + account.name + ': Niveau actuel = ' + currentLevel + '%, Prochain niveau = ' + nextLevel + '%, ' +
                    'Seuil actuel = ' + currentLevelThreshold + ', Seuil suivant = ' + nextLevelThreshold + ', ' +
                    'Progression = ' + progressPercent.toFixed(2) + '%');
      }
    } else {
      progressPercent = 100; // Déjà au niveau maximum
      console.log('Compte ' + account.name + ': Niveau maximum atteint (' + currentLevel + '%)');
    }
    
    return { 
      currentLevel, 
      nextLevel, 
      progressPercent: Math.round(progressPercent * 10) / 10 // Arrondir à une décimale
    };
  }
}
