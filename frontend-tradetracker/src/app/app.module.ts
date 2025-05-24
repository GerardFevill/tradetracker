import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';

// Components
import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AccountsComponent } from './components/accounts/accounts.component';
import { AccountDetailComponent } from './components/account-detail/account-detail.component';
import { AddAccountComponent } from './components/add-account/add-account.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { SettingsComponent } from './components/settings/settings.component';
import { TransferComponent } from './components/transfer/transfer.component';
import { NotificationComponent } from './components/notification/notification.component';
import { AccountStatusCardComponent } from './components/account-status-card/account-status-card.component';

// Services
import { AccountService } from './services/account.service';
import { TransactionService } from './services/transaction.service';
import { AnalyticsService } from './services/analytics.service';
import { NotificationService } from './services/notification.service';
import { HttpErrorInterceptor } from './services/http-error.interceptor';
// Le mock API a été supprimé pour utiliser le vrai backend
import { WithdrawalSettingsComponent } from './components/withdrawal-settings/withdrawal-settings.component';

// Pipes
import { FilterPipe } from './pipes/filter.pipe';
import { BalanceHistoryComponent } from './components/balance-history/balance-history.component';
import { TransactionItemComponent } from './components/transaction-item/transaction-item.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    AccountsComponent,
    AccountDetailComponent,
    AddAccountComponent,
    TransactionsComponent,
    SettingsComponent,
    TransferComponent,
    NotificationComponent,
    WithdrawalSettingsComponent,
    AccountStatusCardComponent,
    FilterPipe,
    BalanceHistoryComponent,
    TransactionItemComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}