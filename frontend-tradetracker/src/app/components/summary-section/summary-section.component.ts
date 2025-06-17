import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountSummary } from '../../models/account.model';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-summary-section',
  templateUrl: './summary-section.component.html',
  styleUrls: ['./summary-section.component.css']
})
export class SummarySectionComponent implements OnInit {
  accountSummary$!: Observable<AccountSummary>;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.accountSummary$ = this.analyticsService.getAccountSummary();
  }
}
