import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, combineLatest, map, of, switchMap } from 'rxjs';
import { Account, Currency } from '../../models/account.model';
import { AccountService } from '../../services/account.service';
import { TransactionService } from '../../services/transaction.service';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.css']
})
export class TransferComponent implements OnInit {
  transferForm!: FormGroup;
  accounts$!: Observable<Account[]>;
  sourceAccount: Account | null = null;
  targetAccount: Account | null = null;
  exchangeRate: number = 1;
  showConfirmation = false;
  
  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private transactionService: TransactionService,
    private analyticsService: AnalyticsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.accounts$ = this.accountService.getAccounts();
    
    this.initForm();
    
    // Watch for source and target account changes to update exchange rate
    this.transferForm.get('sourceAccountId')?.valueChanges.subscribe(sourceId => {
      if (sourceId) {
        this.accountService.getAccountById(sourceId).subscribe(account => {
          this.sourceAccount = account || null;
          this.updateExchangeRate();
        });
      }
    });
    
    this.transferForm.get('targetAccountId')?.valueChanges.subscribe(targetId => {
      if (targetId) {
        this.accountService.getAccountById(targetId).subscribe(account => {
          this.targetAccount = account || null;
          this.updateExchangeRate();
        });
      }
    });
  }
  
  private initForm(): void {
    this.transferForm = this.fb.group({
      sourceAccountId: ['', Validators.required],
      targetAccountId: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      description: ['Transfert entre comptes']
    }, { validators: this.differentAccountsValidator });
  }
  
  // Validator to ensure source and target accounts are different
  private differentAccountsValidator(group: FormGroup): {[key: string]: any} | null {
    const sourceId = group.get('sourceAccountId')?.value;
    const targetId = group.get('targetAccountId')?.value;
    
    return sourceId && targetId && sourceId === targetId 
      ? { sameAccounts: true } 
      : null;
  }
  
  private updateExchangeRate(): void {
    if (this.sourceAccount && this.targetAccount) {
      if (this.sourceAccount.currency === this.targetAccount.currency) {
        this.exchangeRate = 1;
      } else if (this.sourceAccount.currency === 'USD' && this.targetAccount.currency === 'EUR') {
        // Get USD to EUR rate from analytics service
        const rates = this.analyticsService.getExchangeRates();
        this.exchangeRate = rates.USD_TO_EUR;
      } else {
        // Get EUR to USD rate from analytics service
        const rates = this.analyticsService.getExchangeRates();
        this.exchangeRate = rates.EUR_TO_USD;
      }
    }
  }
  
  getTargetAmount(): number {
    const amount = this.transferForm.get('amount')?.value || 0;
    return amount * this.exchangeRate;
  }
  
  onSubmit(): void {
    if (this.transferForm.invalid) return;
    
    this.showConfirmation = true;
  }
  
  confirmTransfer(): void {
    if (!this.sourceAccount || !this.targetAccount) return;
    
    const { sourceAccountId, targetAccountId, amount, description } = this.transferForm.value;
    const targetAmount = this.getTargetAmount();
    
    // Create withdrawal transaction from source account
    const withdrawalTransaction = {
      accountId: sourceAccountId,
      type: 'transfer' as const,
      amount: amount,
      currency: this.sourceAccount.currency,
      date: new Date(),
      description: description,
      targetAccountId: targetAccountId,
      exchangeRate: this.exchangeRate
    };
    
    // Process the transfer
    this.transactionService.addTransaction(withdrawalTransaction).pipe(
      switchMap(() => {
        // Update source account balance
        const newSourceBalance = this.sourceAccount!.currentBalance - amount;
        return this.accountService.updateAccount(sourceAccountId, { 
          currentBalance: newSourceBalance,
          totalWithdrawals: this.sourceAccount!.totalWithdrawals + amount
        });
      }),
      switchMap(() => {
        // Update target account balance
        const newTargetBalance = this.targetAccount!.currentBalance + targetAmount;
        return this.accountService.updateAccount(targetAccountId, { 
          currentBalance: newTargetBalance,
          totalDeposits: this.targetAccount!.totalDeposits + targetAmount
        });
      })
    ).subscribe(() => {
      // Navigate to transactions page after successful transfer
      this.router.navigate(['/transactions']);
    });
  }
  
  cancelTransfer(): void {
    this.showConfirmation = false;
  }
  
  cancel(): void {
    this.router.navigate(['/accounts']);
  }
}
