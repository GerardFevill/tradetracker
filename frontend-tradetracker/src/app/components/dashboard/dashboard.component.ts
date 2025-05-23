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
  totalProfitsUSD$!: Observable<number>;
  totalProfitsEUR$!: Observable<number>;
  totalLossesUSD$!: Observable<number>;
  totalLossesEUR$!: Observable<number>;
  recentPerformance$!: Observable<{period: string, change: number, currency: string}[]>;
  
  // Résumé des comptes par statut
  activeAccountsCount$!: Observable<number>;
  inactiveAccountsCount$!: Observable<number>;
  totalAccountsCount$!: Observable<number>;
  activeAccountsNetResult$!: Observable<number>;
  inactiveAccountsNetResult$!: Observable<number>;
  totalNetResult$!: Observable<number>;
  
  // Solde courant par statut
  activeAccountsCurrentBalance$!: Observable<number>;
  inactiveAccountsCurrentBalance$!: Observable<number>;
  totalCurrentBalance$!: Observable<number>;
  
  // Dépôts totaux par statut
  activeAccountsTotalDeposits$!: Observable<number>;
  inactiveAccountsTotalDeposits$!: Observable<number>;
  totalDeposits$!: Observable<number>;
  
  // Dépôts totaux par devise et statut
  activeAccountsTotalDepositsUSD$!: Observable<number>;
  activeAccountsTotalDepositsEUR$!: Observable<number>;
  inactiveAccountsTotalDepositsUSD$!: Observable<number>;
  inactiveAccountsTotalDepositsEUR$!: Observable<number>;
  totalDepositsUSD$!: Observable<number>;
  totalDepositsEUR$!: Observable<number>;
  
  // Soldes par devise et statut
  activeAccountsBalanceUSD$!: Observable<number>;
  activeAccountsBalanceEUR$!: Observable<number>;
  inactiveAccountsBalanceUSD$!: Observable<number>;
  inactiveAccountsBalanceEUR$!: Observable<number>;
  totalBalanceUSDByStatus$!: Observable<number>;
  totalBalanceEURByStatus$!: Observable<number>;
  
  // Résultats nets par devise et statut
  activeAccountsNetResultUSD$!: Observable<number>;
  activeAccountsNetResultEUR$!: Observable<number>;
  inactiveAccountsNetResultUSD$!: Observable<number>;
  inactiveAccountsNetResultEUR$!: Observable<number>;
  totalNetResultUSD$!: Observable<number>;
  totalNetResultEUR$!: Observable<number>;
  
  // Données pour les graphiques
  accountsByBroker$!: Observable<{broker: string, count: number, percentage: number}[]>;
  accountsByCurrency$!: Observable<{currency: string, count: number, percentage: number}[]>;
  
  // Données pour les graphiques
  netResultHistory: {month: string, usd: number, eur: number}[] = [];

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
    
    // Initialiser les profits et pertes totaux par devise
    this.totalProfitsUSD$ = this.analyticsService.getTotalProfitsInCurrency('USD');
    this.totalProfitsEUR$ = this.analyticsService.getTotalProfitsInCurrency('EUR');
    this.totalLossesUSD$ = this.analyticsService.getTotalLossesInCurrency('USD');
    this.totalLossesEUR$ = this.analyticsService.getTotalLossesInCurrency('EUR');
    
    // Initialiser les données pour le résumé des comptes actifs/inactifs
    this.activeAccountsCount$ = this.analyticsService.getActiveAccountsCount();
    this.inactiveAccountsCount$ = this.analyticsService.getInactiveAccountsCount();
    this.totalAccountsCount$ = this.analyticsService.getTotalAccountsCount();
    this.activeAccountsNetResult$ = this.analyticsService.getActiveAccountsNetResult();
    this.inactiveAccountsNetResult$ = this.analyticsService.getInactiveAccountsNetResult();
    this.totalNetResult$ = this.analyticsService.getTotalNetResult();
    
    // Initialiser les données pour le solde courant par statut
    this.activeAccountsCurrentBalance$ = this.analyticsService.getActiveAccountsCurrentBalance();
    this.inactiveAccountsCurrentBalance$ = this.analyticsService.getInactiveAccountsCurrentBalance();
    this.totalCurrentBalance$ = this.analyticsService.getTotalCurrentBalance();
    
    // Initialiser les données pour les dépôts totaux par statut
    this.activeAccountsTotalDeposits$ = this.analyticsService.getActiveAccountsTotalDeposits();
    this.inactiveAccountsTotalDeposits$ = this.analyticsService.getInactiveAccountsTotalDeposits();
    this.totalDeposits$ = this.analyticsService.getTotalDeposits();
    
    // Initialiser les données pour les dépôts totaux par devise et statut
    this.activeAccountsTotalDepositsUSD$ = this.analyticsService.getActiveAccountsTotalDepositsByCurrency('USD');
    this.activeAccountsTotalDepositsEUR$ = this.analyticsService.getActiveAccountsTotalDepositsByCurrency('EUR');
    this.inactiveAccountsTotalDepositsUSD$ = this.analyticsService.getInactiveAccountsTotalDepositsByCurrency('USD');
    this.inactiveAccountsTotalDepositsEUR$ = this.analyticsService.getInactiveAccountsTotalDepositsByCurrency('EUR');
    this.totalDepositsUSD$ = this.analyticsService.getTotalDepositsByCurrency('USD');
    this.totalDepositsEUR$ = this.analyticsService.getTotalDepositsByCurrency('EUR');
    
    // Initialiser les données pour les soldes par devise et statut
    this.activeAccountsBalanceUSD$ = this.analyticsService.getActiveAccountsBalanceByCurrency('USD');
    this.activeAccountsBalanceEUR$ = this.analyticsService.getActiveAccountsBalanceByCurrency('EUR');
    this.inactiveAccountsBalanceUSD$ = this.analyticsService.getInactiveAccountsBalanceByCurrency('USD');
    this.inactiveAccountsBalanceEUR$ = this.analyticsService.getInactiveAccountsBalanceByCurrency('EUR');
    this.totalBalanceUSDByStatus$ = this.analyticsService.getTotalBalanceByCurrency('USD');
    this.totalBalanceEURByStatus$ = this.analyticsService.getTotalBalanceByCurrency('EUR');
    
    // Initialiser les données pour les résultats nets par devise et statut
    this.activeAccountsNetResultUSD$ = this.analyticsService.getActiveAccountsNetResultByCurrency('USD');
    this.activeAccountsNetResultEUR$ = this.analyticsService.getActiveAccountsNetResultByCurrency('EUR');
    this.inactiveAccountsNetResultUSD$ = this.analyticsService.getInactiveAccountsNetResultByCurrency('USD');
    this.inactiveAccountsNetResultEUR$ = this.analyticsService.getInactiveAccountsNetResultByCurrency('EUR');
    this.totalNetResultUSD$ = this.analyticsService.getTotalNetResultByCurrency('USD');
    this.totalNetResultEUR$ = this.analyticsService.getTotalNetResultByCurrency('EUR');
    
    // Initialiser les données pour les graphiques
    
    this.analyticsService.getNetResultHistory().subscribe(data => {
      this.netResultHistory = data;
      console.log('Historique des résultats nets chargé:', this.netResultHistory);
    });
    
    // Ajouter des logs pour déboguer les valeurs
    this.accountService.getAccounts().subscribe(accounts => {
      console.log('Comptes chargés:', accounts);
      console.log('Nombre de comptes:', accounts.length);
      console.log('Comptes actifs:', accounts.filter(account => account.isActive === undefined ? true : account.isActive).length);
      console.log('Comptes inactifs:', accounts.filter(account => account.isActive === false).length);
      
      // Vérifier les propriétés des comptes
      if (accounts.length > 0) {
        console.log('Premier compte:', accounts[0]);
        console.log('isActive défini?', accounts[0].hasOwnProperty('isActive'));
        console.log('currentBalance:', accounts[0].currentBalance);
        console.log('totalDeposits:', accounts[0].totalDeposits);
        console.log('totalProfits:', accounts[0].totalProfits);
        console.log('totalLosses:', accounts[0].totalLosses);
      }
    });
    
    // Vérifier les valeurs calculées
    this.activeAccountsCount$.subscribe(count => console.log('Nombre de comptes actifs:', count));
    this.activeAccountsCurrentBalance$.subscribe(balance => console.log('Solde des comptes actifs:', balance));
    this.activeAccountsTotalDeposits$.subscribe(deposits => console.log('Dépôts des comptes actifs:', deposits));
    this.activeAccountsBalanceUSD$.subscribe(balance => console.log('Solde USD des comptes actifs:', balance));
    this.activeAccountsBalanceEUR$.subscribe(balance => console.log('Solde EUR des comptes actifs:', balance));
    this.activeAccountsNetResult$.subscribe(result => console.log('Résultat net des comptes actifs:', result));
    
    // Données pour les performances récentes
    this.recentPerformance$ = this.analyticsService.getRecentPerformance();
    
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
