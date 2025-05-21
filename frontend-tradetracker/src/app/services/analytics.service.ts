import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, map, of } from 'rxjs';
import { Account, Currency } from '../models/account.model';
import { AccountService } from './account.service';
import { TransactionService } from './transaction.service';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  // Default exchange rate, should be updated from settings
  private exchangeRate = { EUR_TO_USD: 1.1, USD_TO_EUR: 0.91 };
  
  // Observable to track exchange rate changes
  private exchangeRateSubject = new BehaviorSubject<{ EUR_TO_USD: number, USD_TO_EUR: number }>(this.exchangeRate);
  
  // Données mockées pour les performances des comptes
  private mockPerformanceData: { [accountId: string]: number } = {
    '1': 83.0, // 12450.75 / 15000 * 100
    '2': 87.5, // 8750.50 / 10000 * 100
    '3': 64.0, // 3200.25 / 5000 * 100
    '4': 85.8, // 5150.80 / 6000 * 100
    '5': 78.2  // 7820.45 / 10000 * 100
  };
  
  // Données mockées pour les suggestions de retrait
  private mockWithdrawalSuggestions: { [accountId: string]: number } = {
    '1': 0,     // Sous le seuil
    '2': 0,     // Sous le seuil
    '3': 0,     // Sous le seuil
    '4': 0,     // Sous le seuil
    '5': 0      // Sous le seuil
  };
  
  // Données mockées pour les profits/pertes
  private mockProfitLossData: { [accountId: string]: number } = {
    '1': 4450.75,  // 12450.75 + 2000 - 10000
    '2': 2250.50,  // 8750.50 + 1000 - 7500
    '3': 200.25,   // 3200.25 + 0 - 3000
    '4': 650.80,   // 5150.80 + 500 - 5000
    '5': 1820.45   // 7820.45 + 0 - 6000
  };
  
  // Données mockées pour le ROI
  private mockROIData: { [accountId: string]: number } = {
    '1': 44.51,  // (12450.75 + 2000 - 10000) / 10000 * 100
    '2': 30.01,  // (8750.50 + 1000 - 7500) / 7500 * 100
    '3': 6.68,   // (3200.25 + 0 - 3000) / 3000 * 100
    '4': 13.02,  // (5150.80 + 500 - 5000) / 5000 * 100
    '5': 30.34   // (7820.45 + 0 - 6000) / 6000 * 100
  };

  constructor(
    private accountService: AccountService,
    private transactionService: TransactionService
  ) {}

  setExchangeRates(eurToUsd: number, usdToEur: number): void {
    this.exchangeRate = { EUR_TO_USD: eurToUsd, USD_TO_EUR: usdToEur };
    this.exchangeRateSubject.next(this.exchangeRate);
  }
  
  getExchangeRates(): Observable<{ EUR_TO_USD: number, USD_TO_EUR: number }> {
    return this.exchangeRateSubject.asObservable();
  }

  getAccountPerformance(accountId: string): Observable<number> {
    // Calculer en temps réel pour toujours avoir les données à jour
    return this.accountService.getAccountById(accountId).pipe(
      map(account => {
        if (!account) return 0;
        return account.targetBalance > 0 
          ? (account.currentBalance / account.targetBalance) * 100 
          : 0;
      })
    );
  }

  getWithdrawalSuggestions(accountId: string): Observable<number> {
    // Utiliser les données mockées pour une réponse plus rapide
    if (this.mockWithdrawalSuggestions[accountId] !== undefined) {
      return of(this.mockWithdrawalSuggestions[accountId]);
    }
    
    // Sinon, calculer normalement
    return this.accountService.getAccountById(accountId).pipe(
      map(account => {
        if (!account || account.currentBalance <= account.withdrawalThreshold) return 0;
        // Suggest withdrawing anything above the threshold
        return account.currentBalance - account.withdrawalThreshold;
      })
    );
  }

  getAccountsAboveThreshold(): Observable<Account[]> {
    return this.accountService.getAccounts().pipe(
      map(accounts => accounts.filter(account => 
        account.currentBalance >= account.withdrawalThreshold
      ))
    );
  }

  getTotalBalanceInCurrency(targetCurrency: Currency): Observable<number> {
    return this.accountService.getAccounts().pipe(
      map(accounts => {
        return accounts.reduce((total, account) => {
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
    // Utiliser les données mockées pour une réponse plus rapide
    if (this.mockProfitLossData[accountId] !== undefined) {
      return of(this.mockProfitLossData[accountId]);
    }
    
    // Sinon, calculer normalement
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

  getAccountROI(accountId: string): Observable<number> {
    // Utiliser les données mockées pour une réponse plus rapide
    if (this.mockROIData[accountId] !== undefined) {
      return of(this.mockROIData[accountId]);
    }
    
    // Sinon, calculer normalement
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
}
