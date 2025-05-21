import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
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

// Services
import { AccountService } from './services/account.service';
import { TransactionService } from './services/transaction.service';
import { AnalyticsService } from './services/analytics.service';
import { NotificationService } from './services/notification.service';
import { mockApiProvider } from './services/mock-api.service';
import { WithdrawalSettingsComponent } from './components/withdrawal-settings/withdrawal-settings.component';

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
    WithdrawalSettingsComponent
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
    mockApiProvider
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}