import { Component, OnInit } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AccountService } from '../../services/account.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Account, AccountSummary } from '../../models/account.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  accountSummary$!: Observable<AccountSummary>;
  accountsAboveThreshold$!: Observable<Account[]>;
  totalBalanceUSD$!: Observable<number>;
  totalBalanceEUR$!: Observable<number>;
  
  // Données pour les graphiques
  accountsByBroker$!: Observable<{broker: string, count: number, percentage: number}[]>;
  accountsByCurrency$!: Observable<{currency: string, count: number, percentage: number}[]>;
  
  // Données pour le graphique d'évolution des soldes (simulées pour l'exemple)
  balanceHistory = [
    { month: 'Jan', usd: 10000, eur: 7500 },
    { month: 'Fév', usd: 11200, eur: 8100 },
    { month: 'Mar', usd: 12500, eur: 8800 },
    { month: 'Avr', usd: 13100, eur: 9200 },
    { month: 'Mai', usd: 15000, eur: 10000 },
    { month: 'Juin', usd: 14800, eur: 10500 }
  ];

  constructor(
    private accountService: AccountService,
    private analyticsService: AnalyticsService
  ) {}
  
  // Couleurs pour les graphiques
  private brokerColors = [
    '#0969da', // bleu
    '#2ea043', // vert
    '#dbab09', // jaune
    '#a371f7', // violet
    '#fa7970'  // rouge
  ];
  
  // Retourne une couleur pour un broker en fonction de son index
  getBrokerColor(index: number): string {
    return this.brokerColors[index % this.brokerColors.length];
  }

  ngOnInit(): void {
    this.accountSummary$ = this.accountService.getAccountSummary();
    this.accountsAboveThreshold$ = this.analyticsService.getAccountsAboveThreshold();
    this.totalBalanceUSD$ = this.analyticsService.getTotalBalanceInCurrency('USD');
    this.totalBalanceEUR$ = this.analyticsService.getTotalBalanceInCurrency('EUR');
    
    // Calcul des comptes par broker
    this.accountsByBroker$ = this.accountService.getAccounts().pipe(
      map(accounts => {
        const brokers = accounts.reduce((acc, account) => {
          acc[account.broker] = (acc[account.broker] || 0) + 1;
          return acc;
        }, {} as {[key: string]: number});
        
        const total = accounts.length;
        
        return Object.entries(brokers).map(([broker, count]) => ({
          broker,
          count,
          percentage: (count / total) * 100
        }));
      })
    );
    
    // Calcul des comptes par devise
    this.accountsByCurrency$ = this.accountService.getAccounts().pipe(
      map(accounts => {
        const currencies = accounts.reduce((acc, account) => {
          acc[account.currency] = (acc[account.currency] || 0) + 1;
          return acc;
        }, {} as {[key: string]: number});
        
        const total = accounts.length;
        
        return Object.entries(currencies).map(([currency, count]) => ({
          currency,
          count,
          percentage: (count / total) * 100
        }));
      })
    );
  }
}
