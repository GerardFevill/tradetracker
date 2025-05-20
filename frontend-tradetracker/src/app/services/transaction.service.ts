import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, of } from 'rxjs';
import { Transaction, TransactionType } from '../models/transaction.model';
import { Currency } from '../models/account.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'api/transactions';
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  transactions$ = this.transactionsSubject.asObservable();

  // Données mockées pour simuler les réponses API
  private mockTransactions: Transaction[] = [
    {
      id: '1',
      accountId: '1',
      type: 'deposit',
      amount: 5000,
      currency: 'USD',
      date: new Date('2024-01-20'),
      description: 'Dépôt initial'
    },
    {
      id: '2',
      accountId: '1',
      type: 'deposit',
      amount: 3000,
      currency: 'USD',
      date: new Date('2024-02-15'),
      description: 'Ajout de fonds'
    },
    {
      id: '3',
      accountId: '1',
      type: 'withdrawal',
      amount: 1000,
      currency: 'USD',
      date: new Date('2024-03-10'),
      description: 'Retrait de bénéfices'
    },
    {
      id: '4',
      accountId: '2',
      type: 'deposit',
      amount: 4000,
      currency: 'EUR',
      date: new Date('2024-02-20'),
      description: 'Dépôt initial'
    },
    {
      id: '5',
      accountId: '2',
      type: 'deposit',
      amount: 2500,
      currency: 'EUR',
      date: new Date('2024-03-15'),
      description: 'Ajout de fonds'
    },
    {
      id: '6',
      accountId: '2',
      type: 'withdrawal',
      amount: 500,
      currency: 'EUR',
      date: new Date('2024-04-10'),
      description: 'Retrait partiel'
    },
    {
      id: '7',
      accountId: '3',
      type: 'deposit',
      amount: 3000,
      currency: 'USD',
      date: new Date('2024-03-05'),
      description: 'Financement initial'
    },
    {
      id: '8',
      accountId: '4',
      type: 'deposit',
      amount: 5000,
      currency: 'EUR',
      date: new Date('2024-04-20'),
      description: 'Dépôt initial'
    },
    {
      id: '9',
      accountId: '4',
      type: 'withdrawal',
      amount: 500,
      currency: 'EUR',
      date: new Date('2024-05-15'),
      description: 'Retrait test'
    },
    {
      id: '10',
      accountId: '5',
      type: 'deposit',
      amount: 6000,
      currency: 'USD',
      date: new Date('2024-05-01'),
      description: 'Financement initial'
    },
    {
      id: '11',
      accountId: '1',
      type: 'transfer',
      amount: 2000,
      currency: 'USD',
      date: new Date('2024-04-05'),
      description: 'Transfert vers compte EUR',
      targetAccountId: '2',
      exchangeRate: 0.92
    },
    {
      id: '12',
      accountId: '2',
      type: 'deposit',
      amount: 1840,
      currency: 'EUR',
      date: new Date('2024-04-05'),
      description: 'Transfert depuis compte USD',
    }
  ];

  constructor(private http: HttpClient) {
    // Initialiser avec les données mockées au lieu d'appeler l'API
    this.transactionsSubject.next(this.mockTransactions);
  }

  // Méthode mockée pour simuler le chargement des transactions depuis l'API
  private loadTransactions(): void {
    // Simuler un délai de réseau
    setTimeout(() => {
      this.transactionsSubject.next(this.mockTransactions);
    }, 300);
  }

  getTransactions(): Observable<Transaction[]> {
    return this.transactions$;
  }

  getTransactionsByAccount(accountId: string): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(transactions => transactions.filter(transaction => transaction.accountId === accountId))
    );
  }

  getTransactionsByType(type: TransactionType): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(transactions => transactions.filter(transaction => transaction.type === type))
    );
  }

  addTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    // Simuler la création d'une transaction avec un ID généré
    const newTransaction: Transaction = {
      ...transaction as any,
      id: Math.random().toString(36).substring(2, 11),
      date: new Date()
    };
    
    // Simuler un délai de réseau
    return of(newTransaction).pipe(
      tap(createdTransaction => {
        const currentTransactions = this.transactionsSubject.value;
        this.transactionsSubject.next([...currentTransactions, createdTransaction]);
      })
    );
  }

  updateTransaction(id: string, transaction: Partial<Transaction>): Observable<Transaction> {
    // Trouver la transaction à mettre à jour
    const currentTransactions = this.transactionsSubject.value;
    const index = currentTransactions.findIndex(t => t.id === id);
    
    if (index === -1) {
      return of(null as any);
    }
    
    // Créer la transaction mise à jour
    const updatedTransaction: Transaction = {
      ...currentTransactions[index],
      ...transaction
    };
    
    // Mettre à jour la liste des transactions
    const updatedTransactions = [...currentTransactions];
    updatedTransactions[index] = updatedTransaction;
    
    // Simuler un délai de réseau
    return of(updatedTransaction).pipe(
      tap(() => {
        this.transactionsSubject.next(updatedTransactions);
      })
    );
  }

  deleteTransaction(id: string): Observable<void> {
    // Simuler un délai de réseau
    return of(undefined).pipe(
      tap(() => {
        const currentTransactions = this.transactionsSubject.value;
        this.transactionsSubject.next(currentTransactions.filter(transaction => transaction.id !== id));
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
}
