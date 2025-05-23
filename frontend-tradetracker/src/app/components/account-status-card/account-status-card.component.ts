import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-account-status-card',
  templateUrl: './account-status-card.component.html',
  styleUrls: ['./account-status-card.component.css']
})
export class AccountStatusCardComponent {
  @Input() title: string = '';
  @Input() accountsCount$: Observable<number> | null = null;
  @Input() depositsUSD$: Observable<number> | null = null;
  @Input() depositsEUR$: Observable<number> | null = null;
  @Input() balanceUSD$: Observable<number> | null = null;
  @Input() balanceEUR$: Observable<number> | null = null;
  @Input() netResultUSD$: Observable<number> | null = null;
  @Input() netResultEUR$: Observable<number> | null = null;
  @Input() cardClass: string = '';
}
