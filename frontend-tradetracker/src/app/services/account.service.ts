import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, catchError, of } from 'rxjs';
import { Account, AccountSummary, Currency, Broker } from '../models/account.model';
import { ErrorHandlerService } from './error-handler.service';
import { NumberFormatter } from '../utils/number-formatter';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = `${environment.apiUrl}/accounts`;
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  accounts$ = this.accountsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {
    // Charger les comptes depuis l'API au démarrage
    this.loadAccounts();
  }

  // Méthode pour charger les comptes depuis l'API
  private loadAccounts(): void {
    this.refreshAccounts();
  }
  
  // Méthode publique pour recharger les comptes depuis l'API
  public refreshAccounts(): void {
    this.http.get<Account[]>(this.apiUrl)
      .pipe(
        map(accounts => {
          // Trier les comptes par ordre alphabétique selon leur nom
          return accounts.sort((a, b) => a.name.localeCompare(b.name));
        }),
        catchError(error => {
          // Utiliser le service de gestion d'erreurs pour afficher un message convivial
          this.errorHandler.handleError(error, 'Impossible de charger les comptes');
          // En cas d'erreur, on retourne un tableau vide pour éviter que l'application ne plante
          return of([]);
        })
      )
      .subscribe({
        next: (accounts) => {
          // Si les comptes sont null ou undefined, on utilise un tableau vide
          this.accountsSubject.next(accounts || []);
        },
        error: (error) => {
          // Cette partie ne devrait jamais être exécutée grâce au catchError ci-dessus,
          // mais on la garde par sécurité
          console.error('Erreur non gérée lors du chargement des comptes:', error);
          // En cas d'erreur non gérée, on s'assure que l'application continue de fonctionner
          this.accountsSubject.next([]);
        }
      });
  }

  getAccounts(): Observable<Account[]> {
    return this.accounts$;
  }

  getAccountById(id: string): Observable<Account | undefined> {
    return this.http.get<Account>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Erreur lors de la récupération du compte ${id}:`, error);
        // Fallback sur le filtrage local si l'API échoue
        return this.accounts$.pipe(
          map(accounts => accounts.find(account => account.id === id))
        );
      })
    );
  }

  getAccountsByBroker(broker: string): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.apiUrl}/broker/${broker}`).pipe(
      catchError(error => {
        console.error(`Erreur lors de la récupération des comptes pour le broker ${broker}:`, error);
        // Fallback sur le filtrage local si l'API échoue
        return this.accounts$.pipe(
          map(accounts => accounts.filter(account => account.broker === broker))
        );
      })
    );
  }

  getAccountsByCurrency(currency: Currency): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.apiUrl}/currency/${currency}`).pipe(
      catchError(error => {
        console.error(`Erreur lors de la récupération des comptes pour la devise ${currency}:`, error);
        // Fallback sur le filtrage local si l'API échoue
        return this.accounts$.pipe(
          map(accounts => accounts.filter(account => account.currency === currency))
        );
      })
    );
  }

  createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Observable<Account> {
    // S'assurer que la date de création est définie
    const accountWithDate = {
      ...account,
      // La date de création sera gérée par le backend
    };
    
    return this.http.post<Account>(this.apiUrl, accountWithDate)
      .pipe(
        tap(createdAccount => {
          const currentAccounts = this.accountsSubject.value;
          this.accountsSubject.next([...currentAccounts, createdAccount]);
        }),
        catchError(error => {
          console.error('Erreur lors de la création du compte:', error);
          throw error;
        })
      );
  }

  updateAccount(id: string, account: Partial<Account>): Observable<Account> {
    // Formater les valeurs numériques pour éviter les erreurs de format
    const formattedAccount: Partial<Account> = { ...account };
    
    if (formattedAccount.currentBalance !== undefined) {
      formattedAccount.currentBalance = NumberFormatter.parseNumber(formattedAccount.currentBalance as any);
    }
    
    if (formattedAccount.targetBalance !== undefined) {
      formattedAccount.targetBalance = NumberFormatter.parseNumber(formattedAccount.targetBalance as any);
    }
    
    if (formattedAccount.withdrawalThreshold !== undefined) {
      formattedAccount.withdrawalThreshold = NumberFormatter.parseNumber(formattedAccount.withdrawalThreshold as any);
    }
    
    if (formattedAccount.totalDeposits !== undefined) {
      formattedAccount.totalDeposits = NumberFormatter.parseNumber(formattedAccount.totalDeposits as any);
    }
    
    if (formattedAccount.totalWithdrawals !== undefined) {
      formattedAccount.totalWithdrawals = NumberFormatter.parseNumber(formattedAccount.totalWithdrawals as any);
    }
    
    if (formattedAccount.totalProfits !== undefined) {
      formattedAccount.totalProfits = NumberFormatter.parseNumber(formattedAccount.totalProfits as any);
    }
    
    if (formattedAccount.totalLosses !== undefined) {
      formattedAccount.totalLosses = NumberFormatter.parseNumber(formattedAccount.totalLosses as any);
    }
    
    return this.http.put<Account>(`${this.apiUrl}/${id}`, formattedAccount)
      .pipe(
        tap(updatedAccount => {
          const currentAccounts = this.accountsSubject.value;
          const index = currentAccounts.findIndex(a => a.id === id);
          
          if (index !== -1) {
            const updatedAccounts = [...currentAccounts];
            updatedAccounts[index] = updatedAccount;
            this.accountsSubject.next(updatedAccounts);
          }
        }),
        catchError(error => {
          console.error('Erreur lors de la mise à jour du compte:', error);
          this.errorHandler.handleError(error, 'Erreur lors de la mise à jour du compte');
          throw error;
        })
      );
  }

  deleteAccount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          const currentAccounts = this.accountsSubject.value;
          this.accountsSubject.next(currentAccounts.filter(account => account.id !== id));
        }),
        catchError(error => {
          console.error('Erreur lors de la suppression du compte:', error);
          throw error;
        })
      );
  }

  getAccountSummary(): Observable<AccountSummary> {
    return this.http.get<AccountSummary>(`${this.apiUrl}/summary`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération du résumé des comptes:', error);
          
          // Fallback sur le calcul local si l'API échoue
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
        })
      );
  }

  getTotalProfitsByAccount(accountId: string): Observable<number> {
    return this.getAccountById(accountId).pipe(
      map(account => account?.totalProfits || 0)
    );
  }
  
  getTotalLossesByAccount(accountId: string): Observable<number> {
    return this.getAccountById(accountId).pipe(
      map(account => account?.totalLosses || 0)
    );
  }

  /**
   * Récupère uniquement les comptes actifs
   * @returns Observable contenant un tableau des comptes actifs
   */
  getActiveAccounts(): Observable<Account[]> {
    return this.accounts$.pipe(
      map(accounts => accounts.filter(account => account.isActive === true))
    );
  }

  /**
   * Récupère uniquement les comptes inactifs
   * @returns Observable contenant un tableau des comptes inactifs
   */
  getInactiveAccounts(): Observable<Account[]> {
    return this.accounts$.pipe(
      map(accounts => accounts.filter(account => account.isActive === false))
    );
  }
}
