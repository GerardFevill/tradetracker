import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Account, AccountSummary, Currency, AccountWithWithdrawalInfo, WithdrawalStep } from '../models/account.model';
import { Transaction, TransactionType } from '../models/transaction.model';
import { AccountService } from './account.service';
import { TransactionService } from './transaction.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  // Taux de change fixes
  private exchangeRate = { EUR_TO_USD: 1.1, USD_TO_EUR: 0.91 };

  // URL de l'API depuis le fichier d'environnement
  private apiUrl = environment.apiUrl;

    private withdrawalPlan: WithdrawalStep[] = [
      { percentGoal: 20, withdrawalRate: 0.15 },
      { percentGoal: 40, withdrawalRate: 0.25 },
      { percentGoal: 60, withdrawalRate: 0.30 },
      { percentGoal: 80, withdrawalRate: 0.35 },
      { percentGoal: 90, withdrawalRate: 0.40 },
      { percentGoal: 100, withdrawalRate: 0.50 },
    ];

  constructor(
    private accountService: AccountService,
    private transactionService: TransactionService,
    private http: HttpClient
  ) {}

  getExchangeRates(): { EUR_TO_USD: number, USD_TO_EUR: number } {
    return this.exchangeRate;
  }

  getAccountPerformance(accountId: string): Observable<number> {
    // Calculer en temps réel pour toujours avoir les données à jour
    return this.accountService.getAccountById(accountId).pipe(
      map(account => {
        if (!account) return 0;
        const result = account.targetBalance > 0 
          ? (account.currentBalance / account.targetBalance) * 100 
          : 0;
        return Number(result.toFixed(2));
      })
    );
  }

  getWithdrawalSuggestions(accountId: string): Observable<number> {
    // Calculer la suggestion de retrait en fonction du seuil de retrait
    return this.accountService.getAccountById(accountId).pipe(
      map(account => {
        if (!account || account.currentBalance <= account.withdrawalThreshold) return 0;
        // Suggest withdrawing anything above the threshold
        const result = account.currentBalance - account.withdrawalThreshold;
        return Number(result.toFixed(2));
      })
    );
  }

  /**
   * Retourne les comptes qui ont atteint un palier du plan de retrait
   * avec le montant de retrait recommandé
   * @returns Liste des comptes qui ont atteint un palier avec les informations de retrait
   */
  getAccountsAboveThreshold(): Observable<AccountWithWithdrawalInfo[]> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        return accounts
          .filter(account => {
            // Vérifier que le compte a un capital initial et un objectif définis
            if (!account.initialCapital || !account.targetBalance) return false;
            
            // Calculer le pourcentage de progression vers l'objectif
            const progressPercent = ((account.currentBalance - account.initialCapital) / 
                                   (account.targetBalance - account.initialCapital)) * 100;
            
            // Vérifier si le compte a atteint au moins le premier palier du plan
            return progressPercent >= this.withdrawalPlan[0].percentGoal;
          })
          .map(account => {
            // Calculer le profit absolu
            const profit = account.currentBalance - account.initialCapital;
            
            // Trouver le palier le plus élevé atteint
            const progressPercent = ((account.currentBalance - account.initialCapital) / 
                                   (account.targetBalance - account.initialCapital)) * 100;
            const highestStep = [...this.withdrawalPlan]
              .reverse()
              .find(step => progressPercent >= step.percentGoal);
            
            // Calculer le montant de retrait recommandé
            if (highestStep) {
              // Ajouter le montant de retrait recommandé comme propriété temporaire
              const withdrawalAmount = profit * highestStep.withdrawalRate;
              return {
                ...account,
                recommendedWithdrawal: Number(withdrawalAmount.toFixed(2)),
                withdrawalRate: highestStep.withdrawalRate,
                percentGoal: highestStep.percentGoal
              } as AccountWithWithdrawalInfo;
            }
            
            // Si aucun palier n'est atteint, retourner null pour filtrer ce compte
            return null;
          })
          // Filtrer les valeurs null
          .filter((account): account is AccountWithWithdrawalInfo => account !== null);
      })
    );
  }

  getTotalBalanceInCurrency(targetCurrency: Currency): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts.reduce((total, account) => {
          let balance = account.currentBalance;
          
          // Convert if currencies don't match
          if (account.currency !== targetCurrency) {
            balance = this.convertCurrency(
              balance, 
              account.currency, 
              targetCurrency
            );
          }
          
          return total + balance;
        }, 0);
        return Number(result.toFixed(2));
      })
    );
  }

  private convertCurrency(
    amount: number, 
    fromCurrency: Currency, 
    toCurrency: Currency
  ): number {
    if (fromCurrency === toCurrency) return amount;
    
    if (fromCurrency === 'EUR' && toCurrency === 'USD') {
      return amount * this.exchangeRate.EUR_TO_USD;
    } else {
      return amount * this.exchangeRate.USD_TO_EUR;
    }
  }

  getAccountProfitLoss(accountId: string): Observable<number> {
    // Calculer les profits/pertes en utilisant les données du backend
    return combineLatest([
      this.accountService.getAccountById(accountId),
      this.transactionService.getTotalDepositsByAccount(accountId),
      this.transactionService.getTotalWithdrawalsByAccount(accountId)
    ]).pipe(
      map(([account, totalDeposits, totalWithdrawals]) => {
        if (!account) return 0;
        // Profit/Loss = Current Balance + Total Withdrawals - Total Deposits
        return account.currentBalance + totalWithdrawals - totalDeposits;
      })
    );
  }
  
  /**
   * Calcule la performance d'un compte (pour compatibilité avec le composant AccountDetailComponent)
   * @param account Le compte pour lequel calculer la performance
   * @returns La performance en pourcentage
   */
  calculatePerformance(account: Account): Observable<number> {
    if (!account) return of(0);
    return of(account.targetBalance > 0 
      ? (account.currentBalance / account.targetBalance) * 100 
      : 0);
  }
  
  /**
   * Calcule le profit/perte d'un compte (pour compatibilité avec le composant AccountDetailComponent)
   * @param account Le compte pour lequel calculer le profit/perte
   * @returns Le montant du profit/perte
   */
  calculateProfitLoss(account: Account): Observable<number> {
    if (!account) return of(0);
    // Utiliser directement les propriétés totalProfits et totalLosses du compte
    return of((account.totalProfits || 0) - (account.totalLosses || 0));
  }
  
  /**
   * Calcule le ROI d'un compte (pour compatibilité avec le composant AccountDetailComponent)
   * @param account Le compte pour lequel calculer le ROI
   * @returns Le ROI en pourcentage
   */
  calculateROI(account: Account): Observable<number> {
    if (!account || !account.initialCapital || account.initialCapital <= 0) return of(0);
    const profit = (account.totalProfits || 0) - (account.totalLosses || 0);
    return of((profit / account.initialCapital) * 100);
  }
  
  /**
   * Calcule la suggestion de retrait pour un compte (pour compatibilité avec le composant AccountDetailComponent)
   * @param account Le compte pour lequel calculer la suggestion de retrait
   * @returns Le montant suggéré pour le retrait
   */
  calculateWithdrawalSuggestion(account: Account): Observable<number> {
    if (!account) return of(0);
    return of(account.currentBalance > account.withdrawalThreshold ? 
      account.currentBalance - account.withdrawalThreshold : 0);
  }

  getAccountROI(accountId: string): Observable<number> {
    return combineLatest([
      this.accountService.getAccountById(accountId),
      this.transactionService.getTotalDepositsByAccount(accountId),
      this.transactionService.getTotalWithdrawalsByAccount(accountId)
    ]).pipe(
      map(([account, totalDeposits, totalWithdrawals]) => {
        if (!account || totalDeposits === 0) return 0;
        // ROI = (Current Balance + Total Withdrawals - Total Deposits) / Total Deposits * 100
        const profitLoss = account.currentBalance + totalWithdrawals - totalDeposits;
        return (profitLoss / totalDeposits) * 100;
      })
    );
  }
  
  /**
   * Calcule le total des profits pour une devise spécifique
   * @param currency La devise cible (USD ou EUR)
   * @returns Le montant total des profits dans la devise spécifiée
   */
  getTotalProfitsInCurrency(currency: Currency): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        console.log(`Calcul des profits totaux en ${currency}:`, accounts);
        const result = accounts.reduce((total, account) => {
          let profits = account.totalProfits || 0;
          console.log(`Compte ${account.name} (${account.currency}): profits = ${profits}`);
          
          // Convertir si les devises ne correspondent pas
          if (account.currency !== currency) {
            profits = this.convertCurrency(profits, account.currency, currency);
            console.log(`Après conversion: profits = ${profits}`);
          }
          
          return total + profits;
        }, 0);
        
        console.log(`Total des profits en ${currency}: ${result}`);
        return result;
      })
    );
  }
  
  /**
   * Calcule le total des pertes pour une devise spécifique
   * @param currency La devise cible (USD ou EUR)
   * @returns Le montant total des pertes dans la devise spécifiée
   */
  getTotalLossesInCurrency(currency: Currency): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        console.log(`Calcul des pertes totales en ${currency}:`, accounts);
        const result = accounts.reduce((total, account) => {
          let losses = account.totalLosses || 0;
          console.log(`Compte ${account.name} (${account.currency}): pertes = ${losses}`);
          
          // Convertir si les devises ne correspondent pas
          if (account.currency !== currency) {
            losses = this.convertCurrency(losses, account.currency, currency);
            console.log(`Après conversion: pertes = ${losses}`);
          }
          
          return total + losses;
        }, 0);
        
        console.log(`Total des pertes en ${currency}: ${result}`);
        return result;
      })
    );
  }
  
  /**
   * Récupère les données de performance récente depuis le backend
   * @returns Un tableau d'objets contenant la période, le changement et la devise
   */
  getRecentPerformance(): Observable<{period: string, change: number, currency: string}[]> {
    // Récupérer les données de performance depuis le backend
    return this.http.get<{period: string, change: number, currency: string}[]>(`${this.apiUrl}/analytics/performance`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des performances récentes', error);
          // En cas d'erreur, retourner des données par défaut pour éviter de bloquer l'interface
          return of([
            { period: 'Cette semaine', change: 0, currency: 'USD' },
            { period: 'Ce mois', change: 0, currency: 'USD' },
            { period: 'Ce trimestre', change: 0, currency: 'USD' },
            { period: 'Cette année', change: 0, currency: 'USD' },
            { period: 'Cette semaine', change: 0, currency: 'EUR' },
            { period: 'Ce mois', change: 0, currency: 'EUR' },
            { period: 'Ce trimestre', change: 0, currency: 'EUR' },
            { period: 'Cette année', change: 0, currency: 'EUR' }
          ]);
        })
      );
  }
  
  // Méthodes pour le résumé des comptes actifs/inactifs
  getActiveAccountsCount(): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => accounts.filter(account => account.isActive === undefined ? true : account.isActive).length)
    );
  }
  
  getInactiveAccountsCount(): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => accounts.filter(account => account.isActive === false).length)
    );
  }
  
  getTotalAccountsCount(): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => accounts.length)
    );
  }
  
  getActiveAccountsNetResult(): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => accounts
        .filter(account => account.isActive === undefined ? true : account.isActive)
        .reduce((total, account) => total + (account.totalProfits - account.totalLosses), 0)
      )
    );
  }
  
  getInactiveAccountsNetResult(): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => accounts
        .filter(account => account.isActive === false)
        .reduce((total, account) => total + (account.totalProfits - account.totalLosses), 0)
      )
    );
  }
  
  getTotalNetResult(): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .reduce((total, account) => total + (account.totalProfits - account.totalLosses), 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  // Méthodes pour le solde courant par statut de compte
  getActiveAccountsCurrentBalance(): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .filter(account => account.isActive === undefined ? true : account.isActive)
          .reduce((total, account) => total + account.currentBalance, 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  getInactiveAccountsCurrentBalance(): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .filter(account => account.isActive === false)
          .reduce((total, account) => total + account.currentBalance, 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  getTotalCurrentBalance(): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .reduce((total, account) => total + account.currentBalance, 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  // Méthodes pour les dépôts totaux par statut de compte
  getActiveAccountsTotalDeposits(): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .filter(account => account.isActive === undefined ? true : account.isActive)
          .reduce((total, account) => total + account.totalDeposits, 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  getInactiveAccountsTotalDeposits(): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .filter(account => account.isActive === false)
          .reduce((total, account) => total + account.totalDeposits, 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  getTotalDeposits(): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .reduce((total, account) => total + account.totalDeposits, 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  // Méthodes pour les soldes par devise et statut de compte
  getActiveAccountsBalanceByCurrency(currency: Currency): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .filter(account => (account.isActive === undefined ? true : account.isActive) && account.currency === currency)
          .reduce((total, account) => total + account.currentBalance, 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  getInactiveAccountsBalanceByCurrency(currency: Currency): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .filter(account => account.isActive === false && account.currency === currency)
          .reduce((total, account) => total + account.currentBalance, 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  getTotalBalanceByCurrency(currency: Currency): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .filter(account => account.currency === currency)
          .reduce((total, account) => total + account.currentBalance, 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  // Méthodes pour les dépôts totaux par devise
  getActiveAccountsTotalDepositsByCurrency(currency: Currency): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .filter(account => (account.isActive === undefined ? true : account.isActive) && account.currency === currency)
          .reduce((total, account) => total + account.totalDeposits, 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  getInactiveAccountsTotalDepositsByCurrency(currency: Currency): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .filter(account => account.isActive === false && account.currency === currency)
          .reduce((total, account) => total + account.totalDeposits, 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  getTotalDepositsByCurrency(currency: Currency): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .filter(account => account.currency === currency)
          .reduce((total, account) => total + account.totalDeposits, 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  // Méthodes pour les résultats nets par devise
  getActiveAccountsNetResultByCurrency(currency: Currency): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .filter(account => (account.isActive === undefined ? true : account.isActive) && account.currency === currency)
          .reduce((total, account) => total + (account.totalProfits - account.totalLosses), 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  getInactiveAccountsNetResultByCurrency(currency: Currency): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .filter(account => account.isActive === false && account.currency === currency)
          .reduce((total, account) => total + (account.totalProfits - account.totalLosses), 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  getTotalNetResultByCurrency(currency: string): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        const result = accounts
          .filter(account => account.currency === currency)
          .reduce((total, account) => {
            const netResult = (account.totalProfits || 0) - (account.totalLosses || 0);
            return total + netResult;
          }, 0);
        return Number(result.toFixed(2));
      })
    );
  }
  
  // Méthode pour obtenir l'historique des soldes depuis le backend avec une période spécifiée
  getBalanceHistoryByPeriod(period: string = '1y'): Observable<{month: string, usd: number, eur: number}[]> {
    // Convertir le format de période du frontend au format attendu par le backend
    let backendPeriod: string;
    switch (period) {
      case '1w': backendPeriod = 'week'; break;
      case '1m': backendPeriod = 'month'; break;
      case '3m': backendPeriod = 'threeMonths'; break;
      case '6m': backendPeriod = 'sixMonths'; break;
      case '1y': backendPeriod = 'year'; break;
      default: backendPeriod = 'year';
    }
    
    return this.http.get<any>(`${this.apiUrl}/analytics/balance-history?period=${backendPeriod}`).pipe(
      map(response => {
        // Transformer la réponse au format attendu par le composant
        const result: {month: string, usd: number, eur: number}[] = [];
        
        if (response && response.labels && response.datasets) {
          const usdData = response.datasets.find((d: any) => d.label === 'USD')?.data || [];
          const eurData = response.datasets.find((d: any) => d.label === 'EUR')?.data || [];
          
          response.labels.forEach((month: string, index: number) => {
            result.push({
              month: month,
              usd: usdData[index] || 0,
              eur: eurData[index] || 0
            });
          });
        }
        
        return result;
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération de l\'historique des soldes:', error);
        // En cas d'erreur, retourner des données statiques comme fallback
        return of([]);
      })
    );
  }
  
  // Méthode pour obtenir l'historique des soldes depuis le backend (pour compatibilité)
  getBalanceHistory(): Observable<{month: string, usd: number, eur: number}[]> {
    return this.getBalanceHistoryByPeriod('1y');
  }
  
  // Méthode pour obtenir l'historique des résultats nets depuis le backend
  getNetResultHistory(): Observable<{month: string, usd: number, eur: number}[]> {
    // Utiliser le nouvel endpoint simplifié qui contient les données correctes
    return this.http.get<any>(`${this.apiUrl}/analytics/simple-net-results`).pipe(
      map(response => {
        // Transformer la réponse au format attendu par le composant
        const result: {month: string, usd: number, eur: number}[] = [];
        
        if (response && response.labels && response.datasets) {
          const usdData = response.datasets.find((d: any) => d.label === 'USD')?.data || [];
          const eurData = response.datasets.find((d: any) => d.label === 'EUR')?.data || [];
          
          response.labels.forEach((month: string, index: number) => {
            result.push({
              month: month,
              usd: usdData[index] || 0,
              eur: eurData[index] || 0
            });
          });
        }
        
        return result;
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération de l\'historique des résultats nets:', error);
        // En cas d'erreur, retourner des données statiques comme fallback
        return of([]);
      })
    );
  }

  /**
   * Récupère un résumé des comptes avec les totaux par devise et les performances
   * @returns Un Observable contenant les informations de résumé des comptes
   */
  getAccountSummary(): Observable<AccountSummary> {
    return combineLatest([
      this.getTotalAccountsCount(),
      this.getTotalBalanceByCurrency('USD'),
      this.getTotalBalanceByCurrency('EUR'),
      this.accountService.getAccounts()
    ]).pipe(
      map(([totalAccounts, totalBalanceUSD, totalBalanceEUR, accounts]) => {
        // Calculer les objectifs totaux par devise
        const totalTargetUSD = accounts
          .filter(account => account.currency === 'USD' && account.targetBalance)
          .reduce((total, account) => total + (account.targetBalance || 0), 0);

        const totalTargetEUR = accounts
          .filter(account => account.currency === 'EUR' && account.targetBalance)
          .reduce((total, account) => total + (account.targetBalance || 0), 0);

        // Calculer les performances par devise (en pourcentage)
        const performanceUSD = totalTargetUSD > 0 ? (totalBalanceUSD / totalTargetUSD) * 100 : 0;
        const performanceEUR = totalTargetEUR > 0 ? (totalBalanceEUR / totalTargetEUR) * 100 : 0;

        return {
          totalAccounts,
          totalBalanceUSD,
          totalBalanceEUR,
          totalTargetUSD,
          totalTargetEUR,
          performanceUSD,
          performanceEUR
        };
      })
    );
  }
}
