import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, switchMap, tap, of, map } from 'rxjs';
import { AccountService } from '../../services/account.service';
import { TransactionService } from '../../services/transaction.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Account } from '../../models/account.model';
import { Transaction } from '../../models/transaction.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.css']
})
export class AccountDetailComponent implements OnInit {
  account$!: Observable<Account | undefined>;
  transactions$!: Observable<Transaction[]>;
  performance$!: Observable<number>;
  profitLoss$!: Observable<number>;
  roi$!: Observable<number>;
  withdrawalSuggestion$!: Observable<number>;
  
  transactionForm!: FormGroup;
  thresholdForm!: FormGroup;
  
  showTransactionForm = false;
  
  // Pour stocker les noms des comptes pour les transferts
  private accountNames: {[id: string]: string} = {};
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private transactionService: TransactionService,
    private analyticsService: AnalyticsService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const accountId = this.route.snapshot.paramMap.get('id');
    
    if (!accountId) {
      this.router.navigate(['/accounts']);
      return;
    }
    
    // Charger tous les comptes pour avoir les noms disponibles pour les transferts
    this.accountService.getAccounts().subscribe(accounts => {
      accounts.forEach(account => {
        this.accountNames[account.id] = account.name;
      });
    });
    
    this.account$ = this.accountService.getAccountById(accountId).pipe(
      tap(account => {
        if (!account) {
          this.router.navigate(['/accounts']);
          return;
        }
        
        // Initialize the threshold form with current threshold value
        this.thresholdForm = this.fb.group({
          withdrawalThreshold: [account.withdrawalThreshold, [Validators.required, Validators.min(0)]]
        });
      })
    );
    
    this.transactions$ = this.transactionService.getTransactionsByAccount(accountId);
    this.performance$ = this.analyticsService.getAccountPerformance(accountId);
    this.profitLoss$ = this.analyticsService.getAccountProfitLoss(accountId);
    this.roi$ = this.analyticsService.getAccountROI(accountId);
    this.withdrawalSuggestion$ = this.analyticsService.getWithdrawalSuggestions(accountId);
    
    // Initialize transaction form
    this.transactionForm = this.fb.group({
      type: ['deposit', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      description: ['']
    });
  }
  
  updateThreshold(): void {
    if (this.thresholdForm.invalid) return;
    
    const accountId = this.route.snapshot.paramMap.get('id');
    if (!accountId) return;
    
    const { withdrawalThreshold } = this.thresholdForm.value;
    
    this.accountService.updateAccount(accountId, { withdrawalThreshold })
      .subscribe();
  }
  
  toggleTransactionForm(): void {
    this.showTransactionForm = !this.showTransactionForm;
    if (this.showTransactionForm) {
      this.transactionForm.reset({ type: 'deposit', amount: 0, description: '' });
    }
  }
  
  addTransaction(): void {
    if (this.transactionForm.invalid) return;
    
    const accountId = this.route.snapshot.paramMap.get('id');
    if (!accountId) return;
    
    this.account$.pipe(
      switchMap(account => {
        if (!account) return of(null);
        
        const { type, amount, description } = this.transactionForm.value;
        
        const transaction: Omit<Transaction, 'id'> = {
          accountId,
          type,
          amount,
          currency: account.currency,
          date: new Date(),
          description
        };
        
        // Si c'est un transfert, ajouter les informations supplémentaires
        if (type === 'transfer') {
          // Dans un vrai scénario, on demanderait le compte cible
          // Pour l'exemple, on utilise un compte fictif
          transaction.targetAccountId = '2'; // Compte EUR Stratégie
          transaction.exchangeRate = account.currency === 'USD' ? 0.91 : 1.1;
        }
        
        return this.transactionService.addTransaction(transaction);
      })
    ).subscribe(() => {
      this.toggleTransactionForm();
      
      // Update account balance based on transaction
      this.account$.pipe(
        switchMap(account => {
          if (!account) return of(null);
          
          const { type, amount } = this.transactionForm.value;
          let newBalance = account.currentBalance;
          
          if (type === 'deposit') {
            newBalance += amount;
          } else if (type === 'withdrawal') {
            newBalance -= amount;
          } else if (type === 'transfer') {
            newBalance -= amount;
          }
          
          return this.accountService.updateAccount(accountId!, { 
            currentBalance: newBalance,
            ...(type === 'deposit' ? { totalDeposits: account.totalDeposits + amount } : {}),
            ...(type === 'withdrawal' ? { totalWithdrawals: account.totalWithdrawals + amount } : {})
          });
        })
      ).subscribe();
    });
  }
  
  /**
   * Récupère le nom d'un compte à partir de son ID
   */
  getAccountName(accountId: string): string {
    return this.accountNames[accountId] || `Compte ${accountId}`;
  }
}
