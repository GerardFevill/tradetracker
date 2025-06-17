import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountWithWithdrawalInfo } from '../../models/account.model';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-threshold-alerts',
  templateUrl: './threshold-alerts.component.html',
  styleUrls: ['./threshold-alerts.component.css']
})
export class ThresholdAlertsComponent implements OnInit {
  accountsAboveThreshold$!: Observable<AccountWithWithdrawalInfo[]>;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.accountsAboveThreshold$ = this.analyticsService.getAccountsAboveThreshold();
  }
}
