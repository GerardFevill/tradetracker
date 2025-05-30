import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { Transaction, TransactionType } from '../models/transaction.model';
import { Currency } from '../models/account.model';
import { ErrorHandlerService } from './error-handler.service';
import { NumberFormatter } from '../utils/number-formatter';
import { AccountService } from './account.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/transactions`;
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  transactions$ = this.transactionsSubject.asObservable();
  
  // Variable pour stocker la transaction à éditer
  private transactionToEditSubject = new BehaviorSubject<Transaction | null>(null);
  transactionToEdit$ = this.transactionToEditSubject.asObservable();

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private accountService: AccountService
  ) {
    // Charger les transactions depuis l'API au démarrage
    this.loadTransactions();
  }

  // Méthode pour charger les transactions depuis l'API
  private loadTransactions(): void {
    console.log('Chargement des transactions depuis l\'API...');
    
    this.http.get<Transaction[]>(this.apiUrl)
      .pipe(
        map(transactions => {
          console.log('Transactions reçues de l\'API:', transactions ? transactions.length : 0);
          
          // Vérification et nettoyage des données
          if (!transactions) return [];
          
          // Conversion des montants en nombres
          return transactions.map(transaction => ({
            ...transaction,
            amount: typeof transaction.amount === 'string' ? 
              Number(transaction.amount) : transaction.amount
          }));
        }),
        catchError(error => {
          // Utiliser le service de gestion d'erreurs pour afficher un message convivial
          console.error('Erreur lors du chargement des transactions:', error);
          this.errorHandler.handleError(error, 'Impossible de charger les transactions');
          // En cas d'erreur, on retourne un tableau vide pour éviter que l'application ne plante
          return of([]);
        })
      )
      .subscribe({
        next: (transactions) => {
          console.log('Mise à jour du subject avec', transactions.length, 'transactions');
          // Mise à jour du subject avec les transactions traitées
          this.transactionsSubject.next(transactions);
        },
        error: (error) => {
          // Cette partie ne devrait jamais être exécutée grâce au catchError ci-dessus,
          // mais on la garde par sécurité
          console.error('Erreur non gérée lors du chargement des transactions:', error);
          // En cas d'erreur non gérée, on s'assure que l'application continue de fonctionner
          this.transactionsSubject.next([]);
        }
      });
  }

  getTransactions(): Observable<Transaction[]> {
    return this.transactions$;
  }
  
  // Méthode pour forcer le rechargement des transactions
  refreshTransactions(): void {
    this.loadTransactions();
  }

  getTransactionsByAccount(accountId: string): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/account/${accountId}`).pipe(
      catchError(error => {
        console.error(`Erreur lors de la récupération des transactions pour le compte ${accountId}:`, error);
        // Fallback sur le filtrage local si l'API échoue
        return this.transactions$.pipe(
          map(transactions => transactions.filter(transaction => transaction.accountId === accountId))
        );
      })
    );
  }

  getTransactionsByType(type: TransactionType): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/type/${type}`).pipe(
      catchError(error => {
        console.error(`Erreur lors de la récupération des transactions de type ${type}:`, error);
        // Fallback sur le filtrage local si l'API échoue
        return this.transactions$.pipe(
          map(transactions => transactions.filter(transaction => transaction.type === type))
        );
      })
    );
  }

  addTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    // Formater les valeurs numériques pour éviter les erreurs de format
    const formattedTransaction = { ...transaction };
    
    // Définir la date du jour si elle n'est pas spécifiée
    if (!formattedTransaction.date) {
      formattedTransaction.date = new Date();
    }
    
    if (formattedTransaction.amount !== undefined) {
      formattedTransaction.amount = NumberFormatter.parseNumber(formattedTransaction.amount as any);
    }
    
    return this.http.post<Transaction>(this.apiUrl, formattedTransaction)
      .pipe(
        tap(createdTransaction => {
          // Mettre à jour la liste des transactions
          const currentTransactions = this.transactionsSubject.value;
          this.transactionsSubject.next([...currentTransactions, createdTransaction]);
          
          // Recharger les comptes pour mettre à jour les soldes
          this.accountService.refreshAccounts();
        }),
        catchError(error => {
          console.error('Erreur lors de la création de la transaction:', error);
          this.errorHandler.handleError(error, 'Erreur lors de la création de la transaction');
          throw error;
        })
      );
  }

  updateTransaction(id: string, transaction: Partial<Transaction>): Observable<Transaction> {
    // Formater les valeurs numériques pour éviter les erreurs de format
    const formattedTransaction = { ...transaction };
    
    if (formattedTransaction.amount !== undefined) {
      formattedTransaction.amount = NumberFormatter.parseNumber(formattedTransaction.amount as any);
    }
    
    return this.http.put<Transaction>(`${this.apiUrl}/${id}`, formattedTransaction)
      .pipe(
        tap(updatedTransaction => {
          // Mettre à jour la liste des transactions
          const currentTransactions = this.transactionsSubject.value;
          const index = currentTransactions.findIndex(t => t.id === id);
          
          if (index !== -1) {
            const updatedTransactions = [...currentTransactions];
            updatedTransactions[index] = updatedTransaction;
            this.transactionsSubject.next(updatedTransactions);
          }
          
          // Recharger les comptes pour mettre à jour les soldes
          this.accountService.refreshAccounts();
        }),
        catchError(error => {
          console.error('Erreur lors de la mise à jour de la transaction:', error);
          this.errorHandler.handleError(error, 'Erreur lors de la mise à jour de la transaction');
          throw error;
        })
      );
  }

  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          // Mettre à jour la liste des transactions
          const currentTransactions = this.transactionsSubject.value;
          this.transactionsSubject.next(currentTransactions.filter(transaction => transaction.id !== id));
          
          // Recharger les comptes pour mettre à jour les soldes
          this.accountService.refreshAccounts();
        }),
        catchError(error => {
          console.error('Erreur lors de la suppression de la transaction:', error);
          throw error;
        })
      );
  }

  getTotalDepositsByAccount(accountId: string): Observable<number> {
    return this.getTransactionsByAccount(accountId).pipe(
      map(transactions => 
        transactions
          .filter(t => t.type === 'deposit')
          .reduce((sum, t) => sum + t.amount, 0)
      )
    );
  }

  getTotalWithdrawalsByAccount(accountId: string): Observable<number> {
    return this.getTransactionsByAccount(accountId).pipe(
      map(transactions => 
        transactions
          .filter(t => t.type === 'withdrawal')
          .reduce((sum, t) => sum + t.amount, 0)
      )
    );
  }
  
  getTotalProfitsByAccount(accountId: string): Observable<number> {
    return this.getTransactionsByAccount(accountId).pipe(
      map(transactions => 
        transactions
          .filter(t => t.type === 'profit')
          .reduce((sum, t) => sum + t.amount, 0)
      )
    );
  }
  
  getTotalLossesByAccount(accountId: string): Observable<number> {
    return this.getTransactionsByAccount(accountId).pipe(
      map(transactions => 
        transactions
          .filter(t => t.type === 'loss')
          .reduce((sum, t) => sum + t.amount, 0)
      )
    );
  }
  
  // Méthode pour stocker une transaction à éditer
  setTransactionToEdit(transaction: Transaction | null): void {
    this.transactionToEditSubject.next(transaction);
  }
  
  // Méthode pour récupérer la transaction à éditer
  getTransactionToEdit(): Observable<Transaction | null> {
    return this.transactionToEdit$;
  }
}
