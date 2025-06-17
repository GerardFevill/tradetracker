import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';

// Components
import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AccountsComponent } from './components/accounts/accounts.component';
import { AccountDetailComponent } from './components/account-detail/account-detail.component';
import { AddAccountComponent } from './components/add-account/add-account.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { TransferComponent } from './components/transfer/transfer.component';
import { NotificationComponent } from './components/notification/notification.component';
import { AccountStatusCardComponent } from './components/account-status-card/account-status-card.component';
import { BalanceHistoryComponent } from './components/balance-history/balance-history.component';
import { TransactionItemComponent } from './components/transaction-item/transaction-item.component';

// Services
import { AccountService } from './services/account.service';
import { TransactionService } from './services/transaction.service';
import { AnalyticsService } from './services/analytics.service';
import { NotificationService } from './services/notification.service';
import { HttpErrorInterceptor } from './services/http-error.interceptor';
import { WithdrawalPlanService } from './services/withdrawal-plan.service';
// Le mock API a été supprimé pour utiliser le vrai backend

// Pipes
import { FilterPipe } from './pipes/filter.pipe';
import { ThresholdAlertsComponent } from './components/threshold-alerts/threshold-alerts.component';
import { SummarySectionComponent } from './components/summary-section/summary-section.component';
import { AccountStatusSectionComponent } from './components/account-status-section/account-status-section.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    AccountsComponent,
    AccountDetailComponent,
    AddAccountComponent,
    TransactionsComponent,
    TransferComponent,
    NotificationComponent,
    AccountStatusCardComponent,
    FilterPipe,
    BalanceHistoryComponent,
    TransactionItemComponent,
    ThresholdAlertsComponent,
    SummarySectionComponent,
    AccountStatusSectionComponent,
    QuickActionsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    AccountService,
    TransactionService,
    AnalyticsService,
    NotificationService,
    WithdrawalPlanService,
    CurrencyPipe,
    DecimalPipe,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}