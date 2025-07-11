import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../services/account.service';
import { Broker, Currency } from '../../models/account.model';

@Component({
  selector: 'app-add-account',
  templateUrl: './add-account.component.html',
  styleUrls: ['./add-account.component.css']
})
export class AddAccountComponent implements OnInit {
  accountForm!: FormGroup;
  currencies: Currency[] = ['USD', 'EUR'];
  brokers: Broker[] = ['Roboforex', 'IC Markets', 'Other'];
  
  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }
  
  private initForm(): void {
    this.accountForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      broker: ['Roboforex', Validators.required],
      currency: ['USD', Validators.required],
      currentBalance: [0, [Validators.required, Validators.min(0)]],
      initialCapital: [0, [Validators.required, Validators.min(0)]],
      targetBalance: [0, [Validators.required, Validators.min(0)]],
      withdrawalThreshold: [0, [Validators.required, Validators.min(0)]],
      otherBroker: ['']
    });
    
    // Watch for broker changes to handle 'Other' option
    this.accountForm.get('broker')?.valueChanges.subscribe(value => {
      const otherBrokerControl = this.accountForm.get('otherBroker');
      
      if (value === 'Other') {
        otherBrokerControl?.setValidators([Validators.required, Validators.minLength(2)]);
      } else {
        otherBrokerControl?.clearValidators();
      }
      
      otherBrokerControl?.updateValueAndValidity();
    });
  }
  
  onSubmit(): void {
    if (this.accountForm.invalid) return;
    
    const formValue = this.accountForm.value;
    
    // Handle 'Other' broker
    let broker = formValue.broker;
    if (broker === 'Other' && formValue.otherBroker) {
      broker = formValue.otherBroker;
    }
    
    const newAccount = {
      name: formValue.name,
      broker: broker,
      currency: formValue.currency,
      currentBalance: formValue.currentBalance,
      initialCapital: formValue.initialCapital, // Capital initial fourni par l'utilisateur
      targetBalance: formValue.targetBalance,
      withdrawalThreshold: formValue.withdrawalThreshold,
      totalDeposits: formValue.currentBalance, // Initial deposit equals current balance
      totalWithdrawals: 0,
      totalProfits: 0, // Nouveau compte, pas encore de profits
      totalLosses: 0, // Nouveau compte, pas encore de pertes
      isActive: true // Par défaut, les nouveaux comptes sont actifs
      // La date de création est gérée par le backend
    };
    
    this.accountService.createAccount(newAccount).subscribe(account => {
      this.router.navigate(['/accounts', account.id]);
    });
  }
  
  cancel(): void {
    this.router.navigate(['/accounts']);
  }
}
