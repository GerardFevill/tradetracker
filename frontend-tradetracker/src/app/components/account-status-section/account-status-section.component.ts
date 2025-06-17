import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Account } from '../../models/account.model';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-account-status-section',
  templateUrl: './account-status-section.component.html',
  styleUrls: ['./account-status-section.component.css']
})
export class AccountStatusSectionComponent implements OnInit {
  accounts$!: Observable<Account[]>;
  activeAccounts$!: Observable<Account[]>;
  inactiveAccounts$!: Observable<Account[]>;

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.accounts$ = this.accountService.getAccounts();
    this.activeAccounts$ = this.accountService.getActiveAccounts();
    this.inactiveAccounts$ = this.accountService.getInactiveAccounts();
  }
}
