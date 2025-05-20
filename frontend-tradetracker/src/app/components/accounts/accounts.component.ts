import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AccountService } from '../../services/account.service';
import { Account, Currency } from '../../models/account.model';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent implements OnInit {
  accounts$!: Observable<Account[]>;
  filteredAccounts$!: Observable<Account[]>;
  selectedCurrency: Currency | 'all' = 'all';
  selectedBroker: string | 'all' = 'all';

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.accounts$ = this.accountService.getAccounts();
    this.filteredAccounts$ = this.accounts$;
  }

  filterByCurrency(currency: Currency | 'all'): void {
    this.selectedCurrency = currency;
    this.applyFilters();
  }

  filterByBroker(broker: string | 'all'): void {
    this.selectedBroker = broker;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered$ = this.accounts$;

    if (this.selectedCurrency !== 'all') {
      filtered$ = this.accountService.getAccountsByCurrency(this.selectedCurrency as Currency);
    }

    if (this.selectedBroker !== 'all' && this.selectedCurrency !== 'all') {
      // We need to filter the already currency-filtered accounts by broker
      this.filteredAccounts$ = filtered$.pipe(
        map((accounts: Account[]) => accounts.filter((account: Account) => account.broker === this.selectedBroker))
      );
    } else if (this.selectedBroker !== 'all') {
      // Just filter by broker
      this.filteredAccounts$ = this.accountService.getAccountsByBroker(this.selectedBroker);
    } else {
      // No broker filter, just use the currency filter (or all accounts if no currency filter)
      this.filteredAccounts$ = filtered$;
    }
  }

  deleteAccount(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce compte?')) {
      this.accountService.deleteAccount(id).subscribe();
    }
  }
}
