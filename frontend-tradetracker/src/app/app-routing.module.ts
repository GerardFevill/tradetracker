import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AccountsComponent } from './components/accounts/accounts.component';
import { AccountDetailComponent } from './components/account-detail/account-detail.component';
import { AddAccountComponent } from './components/add-account/add-account.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { SettingsComponent } from './components/settings/settings.component';
import { TransferComponent } from './components/transfer/transfer.component';
import { WithdrawalSettingsComponent } from './components/withdrawal-settings/withdrawal-settings.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'accounts', component: AccountsComponent },
  { path: 'accounts/new', component: AddAccountComponent },
  { path: 'accounts/:id', component: AccountDetailComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: 'transfer', component: TransferComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'withdrawal-settings', component: WithdrawalSettingsComponent },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
