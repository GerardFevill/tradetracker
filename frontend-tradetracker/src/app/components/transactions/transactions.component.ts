import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { TransactionService } from '../../services/transaction.service';
import { AccountService } from '../../services/account.service';
import { Transaction } from '../../models/transaction.model';
import { Account, Currency } from '../../models/account.model';

interface TransactionWithAccountName extends Transaction {
  accountName: string;
}

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit {
  transactions$!: Observable<TransactionWithAccountName[]>;
  filteredTransactions$!: Observable<TransactionWithAccountName[]>;
  
  selectedType: 'all' | 'deposit' | 'withdrawal' = 'all';
  selectedCurrency: Currency | 'all' = 'all';
  selectedAccountId: string | 'all' = 'all';
  
  accounts$!: Observable<Account[]>;
  
  constructor(
    private transactionService: TransactionService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.accounts$ = this.accountService.getAccounts();
    
    // Combine transactions with account names
    this.transactions$ = combineLatest([
      this.transactionService.getTransactions(),
      this.accountService.getAccounts()
    ]).pipe(
      map(([transactions, accounts]) => {
        return transactions.map(transaction => {
          const account = accounts.find(a => a.id === transaction.accountId);
          return {
            ...transaction,
            accountName: account ? account.name : 'Compte inconnu'
          };
        });
      }),
      // Sort by date, newest first
      map(transactions => 
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      )
    );
    
    this.filteredTransactions$ = this.transactions$;
  }
  
  filterByType(type: 'all' | 'deposit' | 'withdrawal'): void {
    this.selectedType = type;
    this.applyFilters();
  }
  
  filterByCurrency(currency: Currency | 'all'): void {
    this.selectedCurrency = currency;
    this.applyFilters();
  }
  
  filterByAccount(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedAccountId = selectElement.value as string | 'all';
    this.applyFilters();
  }
  
  private applyFilters(): void {
    this.filteredTransactions$ = this.transactions$.pipe(
      map(transactions => {
        let filtered = transactions;
        
        // Filter by type
        if (this.selectedType !== 'all') {
          filtered = filtered.filter(t => t.type === this.selectedType);
        }
        
        // Filter by currency
        if (this.selectedCurrency !== 'all') {
          filtered = filtered.filter(t => t.currency === this.selectedCurrency);
        }
        
        // Filter by account
        if (this.selectedAccountId !== 'all') {
          filtered = filtered.filter(t => t.accountId === this.selectedAccountId);
        }
        
        return filtered;
      })
    );
  }
  
  getTotalAmount(transactions: TransactionWithAccountName[]): { [key in Currency]: number } {
    return transactions.reduce((totals, transaction) => {
      const currency = transaction.currency;
      if (!totals[currency]) {
        totals[currency] = 0;
      }
      
      if (transaction.type === 'deposit') {
        totals[currency] += transaction.amount;
      } else {
        totals[currency] -= transaction.amount;
      }
      
      return totals;
    }, {} as { [key in Currency]: number });
  }
}
