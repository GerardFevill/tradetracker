import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, of } from 'rxjs';
import { Account, AccountSummary, Currency, Broker } from '../models/account.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = 'api/accounts';
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  accounts$ = this.accountsSubject.asObservable();
  
  // Données mockées pour simuler les réponses API
  private mockAccounts: Account[] = [
    {
      id: '1',
      name: 'Compte Trading Principal',
      broker: 'Roboforex',
      currency: 'USD',
      currentBalance: 12450.75,
      targetBalance: 15000,
      withdrawalThreshold: 13000,
      totalDeposits: 10000,
      totalWithdrawals: 2000,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2025-04-28')
    },
    {
      id: '2',
      name: 'Compte EUR Stratégie',
      broker: 'IC Markets',
      currency: 'EUR',
      currentBalance: 8750.50,
      targetBalance: 10000,
      withdrawalThreshold: 9000,
      totalDeposits: 7500,
      totalWithdrawals: 1000,
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2025-05-15')
    },
    {
      id: '3',
      name: 'Compte Test Algorithmes',
      broker: 'Roboforex',
      currency: 'USD',
      currentBalance: 3200.25,
      targetBalance: 5000,
      withdrawalThreshold: 4000,
      totalDeposits: 3000,
      totalWithdrawals: 0,
      createdAt: new Date('2024-03-05'),
      updatedAt: new Date('2025-05-10')
    },
    {
      id: '4',
      name: 'Compte EUR Conservateur',
      broker: 'Other',
      currency: 'EUR',
      currentBalance: 5150.80,
      targetBalance: 6000,
      withdrawalThreshold: 5500,
      totalDeposits: 5000,
      totalWithdrawals: 500,
      createdAt: new Date('2024-04-20'),
      updatedAt: new Date('2025-05-18')
    },
    {
      id: '5',
      name: 'Compte USD Agressif',
      broker: 'IC Markets',
      currency: 'USD',
      currentBalance: 7820.45,
      targetBalance: 10000,
      withdrawalThreshold: 8500,
      totalDeposits: 6000,
      totalWithdrawals: 0,
      createdAt: new Date('2024-05-01'),
      updatedAt: new Date('2025-05-19')
    }
  ];

  constructor(private http: HttpClient) {
    // Initialiser avec les données mockées au lieu d'appeler l'API
    this.accountsSubject.next(this.mockAccounts);
  }

  // Méthode mockée pour simuler le chargement des comptes depuis l'API
  private loadAccounts(): void {
    // Simuler un délai de réseau
    setTimeout(() => {
      this.accountsSubject.next(this.mockAccounts);
    }, 300);
  }

  getAccounts(): Observable<Account[]> {
    return this.accounts$;
  }

  getAccountById(id: string): Observable<Account | undefined> {
    return this.accounts$.pipe(
      map(accounts => accounts.find(account => account.id === id))
    );
  }

  getAccountsByBroker(broker: string): Observable<Account[]> {
    return this.accounts$.pipe(
      map(accounts => accounts.filter(account => account.broker === broker))
    );
  }

  getAccountsByCurrency(currency: Currency): Observable<Account[]> {
    return this.accounts$.pipe(
      map(accounts => accounts.filter(account => account.currency === currency))
    );
  }

  createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Observable<Account> {
    // Simuler la création d'un compte avec un ID généré
    const newAccount: Account = {
      ...account as any,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Simuler un délai de réseau
    return of(newAccount).pipe(
      tap(createdAccount => {
        const currentAccounts = this.accountsSubject.value;
        this.accountsSubject.next([...currentAccounts, createdAccount]);
      })
    );
  }

  updateAccount(id: string, account: Partial<Account>): Observable<Account> {
    // Trouver le compte à mettre à jour
    const currentAccounts = this.accountsSubject.value;
    const index = currentAccounts.findIndex(a => a.id === id);
    
    if (index === -1) {
      return of(null as any);
    }
    
    // Créer le compte mis à jour
    const updatedAccount: Account = {
      ...currentAccounts[index],
      ...account,
      updatedAt: new Date()
    };
    
    // Mettre à jour la liste des comptes
    const updatedAccounts = [...currentAccounts];
    updatedAccounts[index] = updatedAccount;
    
    // Simuler un délai de réseau
    return of(updatedAccount).pipe(
      tap(() => {
        this.accountsSubject.next(updatedAccounts);
      })
    );
  }

  deleteAccount(id: string): Observable<void> {
    // Simuler un délai de réseau
    return of(undefined).pipe(
      tap(() => {
        const currentAccounts = this.accountsSubject.value;
        this.accountsSubject.next(currentAccounts.filter(account => account.id !== id));
      })
    );
  }

  getAccountSummary(): Observable<AccountSummary> {
    return this.accounts$.pipe(
      map(accounts => {
        const usdAccounts = accounts.filter(account => account.currency === 'USD');
        const eurAccounts = accounts.filter(account => account.currency === 'EUR');

        const totalBalanceUSD = usdAccounts.reduce((sum, account) => sum + account.currentBalance, 0);
        const totalBalanceEUR = eurAccounts.reduce((sum, account) => sum + account.currentBalance, 0);
        
        const totalTargetUSD = usdAccounts.reduce((sum, account) => sum + account.targetBalance, 0);
        const totalTargetEUR = eurAccounts.reduce((sum, account) => sum + account.targetBalance, 0);
        
        const performanceUSD = totalTargetUSD > 0 ? (totalBalanceUSD / totalTargetUSD) * 100 : 0;
        const performanceEUR = totalTargetEUR > 0 ? (totalBalanceEUR / totalTargetEUR) * 100 : 0;

        return {
          totalAccounts: accounts.length,
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
