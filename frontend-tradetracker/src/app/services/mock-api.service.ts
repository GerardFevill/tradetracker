import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, materialize, dematerialize } from 'rxjs/operators';
import { Account, Broker, Currency } from '../models/account.model';
import { Transaction, TransactionType } from '../models/transaction.model';

// Mock data
const accounts: Account[] = [
  {
    id: '1',
    name: 'Compte Principal USD',
    broker: 'Roboforex',
    currency: 'USD',
    currentBalance: 5240.75,
    targetBalance: 10000,
    withdrawalThreshold: 5000,
    totalDeposits: 3000,
    totalWithdrawals: 500,
    totalProfits: 3000,
    totalLosses: 260,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2025-04-10')
  },
  {
    id: '2',
    name: 'Compte Secondaire EUR',
    broker: 'IC Markets',
    currency: 'EUR',
    currentBalance: 3850.20,
    targetBalance: 5000,
    withdrawalThreshold: 3500,
    totalDeposits: 2500,
    totalWithdrawals: 0,
    totalProfits: 1500,
    totalLosses: 150,
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2025-05-01')
  },
  {
    id: '3',
    name: 'Compte Test USD',
    broker: 'Other',
    currency: 'USD',
    currentBalance: 1200.50,
    targetBalance: 2000,
    withdrawalThreshold: 1000,
    totalDeposits: 1000,
    totalWithdrawals: 0,
    totalProfits: 300,
    totalLosses: 100,
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-05-15')
  }
];

const transactions: Transaction[] = [
  {
    id: '1',
    accountId: '1',
    type: 'deposit',
    amount: 1000,
    currency: 'USD',
    date: new Date('2024-01-15'),
    description: 'Dépôt initial'
  },
  {
    id: '2',
    accountId: '1',
    type: 'deposit',
    amount: 2000,
    currency: 'USD',
    date: new Date('2024-02-20'),
    description: 'Ajout de fonds'
  },
  {
    id: '3',
    accountId: '1',
    type: 'withdrawal',
    amount: 500,
    currency: 'USD',
    date: new Date('2025-03-15'),
    description: 'Retrait partiel'
  },
  {
    id: '4',
    accountId: '2',
    type: 'deposit',
    amount: 2500,
    currency: 'EUR',
    date: new Date('2024-03-05'),
    description: 'Dépôt initial'
  },
  {
    id: '5',
    accountId: '3',
    type: 'deposit',
    amount: 1000,
    currency: 'USD',
    date: new Date('2025-01-10'),
    description: 'Dépôt initial'
  }
];

@Injectable()
export class MockApiInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const { url, method, headers, body } = request;

    // Wrap in delayed observable to simulate server api call
    return of(null)
      .pipe(delay(500))
      .pipe(materialize())
      .pipe(dematerialize())
      .pipe(delay(500))
      .pipe(() => {
        // Accounts API
        if (url.endsWith('/api/accounts') && method === 'GET') {
          return of(new HttpResponse({ status: 200, body: accounts }));
        }
        
        if (url.match(/\/api\/accounts\/\d+$/) && method === 'GET') {
          const id = url.split('/').pop();
          const account = accounts.find(a => a.id === id);
          return account 
            ? of(new HttpResponse({ status: 200, body: account }))
            : throwError(() => new Error('Account not found'));
        }
        
        if (url.endsWith('/api/accounts') && method === 'POST') {
          const newAccount: Account = {
            ...body,
            id: (accounts.length + 1).toString(),
            totalProfits: body.totalProfits || 0,
            totalLosses: body.totalLosses || 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          accounts.push(newAccount);
          return of(new HttpResponse({ status: 201, body: newAccount }));
        }
        
        if (url.match(/\/api\/accounts\/\d+$/) && method === 'PUT') {
          const id = url.split('/').pop();
          const accountIndex = accounts.findIndex(a => a.id === id);
          if (accountIndex === -1) return throwError(() => new Error('Account not found'));
          
          accounts[accountIndex] = { 
            ...accounts[accountIndex], 
            ...body,
            updatedAt: new Date()
          };
          return of(new HttpResponse({ status: 200, body: accounts[accountIndex] }));
        }
        
        if (url.match(/\/api\/accounts\/\d+$/) && method === 'DELETE') {
          const id = url.split('/').pop();
          const accountIndex = accounts.findIndex(a => a.id === id);
          if (accountIndex === -1) return throwError(() => new Error('Account not found'));
          
          accounts.splice(accountIndex, 1);
          return of(new HttpResponse({ status: 204 }));
        }
        
        // Transactions API
        if (url.endsWith('/api/transactions') && method === 'GET') {
          return of(new HttpResponse({ status: 200, body: transactions }));
        }
        
        if (url.match(/\/api\/transactions\/\d+$/) && method === 'GET') {
          const id = url.split('/').pop();
          const transaction = transactions.find(t => t.id === id);
          return transaction 
            ? of(new HttpResponse({ status: 200, body: transaction }))
            : throwError(() => new Error('Transaction not found'));
        }
        
        if (url.endsWith('/api/transactions') && method === 'POST') {
          const newTransaction: Transaction = {
            ...body,
            id: (transactions.length + 1).toString(),
            date: new Date(body.date) || new Date()
          };
          transactions.push(newTransaction);
          return of(new HttpResponse({ status: 201, body: newTransaction }));
        }
        
        if (url.match(/\/api\/transactions\/\d+$/) && method === 'PUT') {
          const id = url.split('/').pop();
          const transactionIndex = transactions.findIndex(t => t.id === id);
          if (transactionIndex === -1) return throwError(() => new Error('Transaction not found'));
          
          transactions[transactionIndex] = { 
            ...transactions[transactionIndex], 
            ...body,
            date: new Date(body.date) || transactions[transactionIndex].date
          };
          return of(new HttpResponse({ status: 200, body: transactions[transactionIndex] }));
        }
        
        if (url.match(/\/api\/transactions\/\d+$/) && method === 'DELETE') {
          const id = url.split('/').pop();
          const transactionIndex = transactions.findIndex(t => t.id === id);
          if (transactionIndex === -1) return throwError(() => new Error('Transaction not found'));
          
          transactions.splice(transactionIndex, 1);
          return of(new HttpResponse({ status: 204 }));
        }
        
        // Pass through any requests not handled above
        return next.handle(request);
      });
  }
}

export const mockApiProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: MockApiInterceptor,
  multi: true
};
