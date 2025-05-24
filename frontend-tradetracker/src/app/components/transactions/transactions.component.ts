import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, combineLatest, map, BehaviorSubject, Subscription, finalize, catchError, of } from 'rxjs';
import { TransactionService } from '../../services/transaction.service';
import { AccountService } from '../../services/account.service';
import { Transaction } from '../../models/transaction.model';
import { Account, Currency } from '../../models/account.model';
import { NotificationService } from '../../services/notification.service';

interface TransactionWithAccountName extends Transaction {
  accountName: string;
}

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit, OnDestroy {
  // Flux de données
  transactions$!: Observable<TransactionWithAccountName[]>;
  filteredTransactions$!: Observable<TransactionWithAccountName[]>;
  accounts$!: Observable<Account[]>;
  
  // État du composant
  selectedType: 'all' | 'deposit' | 'withdrawal' | 'transfer' | 'profit' | 'loss' = 'all';
  selectedCurrency: Currency | 'all' = 'all';
  selectedAccountId: string | 'all' = 'all';
  
  // État pour la confirmation de suppression
  showDeleteConfirmation: boolean = false;
  transactionToDelete: TransactionWithAccountName | null = null;
  
  // État de chargement et erreurs
  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();
  error = new BehaviorSubject<string | null>(null);
  error$ = this.error.asObservable();
  
  // Abonnements pour éviter les fuites mémoire
  private subscriptions: Subscription[] = [];
  
  constructor(
    private transactionService: TransactionService,
    private accountService: AccountService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialisation du chargement
    this.loading.next(true);
    this.error.next(null);
    
    // Récupération des comptes
    this.accounts$ = this.accountService.getAccounts().pipe(
      catchError(error => {
        console.error('Erreur lors du chargement des comptes:', error);
        this.error.next('Impossible de charger les comptes. Veuillez réessayer.');
        this.loading.next(false); // Arrêter le chargement en cas d'erreur
        return of([]);
      })
    );
    
    // Abonnement direct pour s'assurer que le chargement s'arrête
    const accountsSub = this.accounts$.subscribe({
      next: () => {
        // Ne rien faire ici, le chargement sera géré par le combineLatest
      },
      error: () => {
        // S'assurer que le chargement s'arrête en cas d'erreur
        this.loading.next(false);
      }
    });
    this.subscriptions.push(accountsSub);
    
    // Combine transactions with account names with improved error handling
    this.transactions$ = combineLatest([
      this.transactionService.getTransactions(),
      this.accounts$
    ]).pipe(
      map(([transactions, accounts]) => {
        // Arrêter explicitement le chargement ici
        this.loading.next(false);
        
        // Traitement des données
        return transactions.map(transaction => {
          const account = accounts.find(a => a.id === transaction.accountId);
          const targetAccount = transaction.targetAccountId 
            ? accounts.find(a => a.id === transaction.targetAccountId)
            : null;
            
          return {
            ...transaction,
            accountName: account ? account.name : 'Compte inconnu',
            targetAccountName: targetAccount ? targetAccount.name : 'Compte inconnu'
          };
        });
      }),
      // Sort by date, newest first
      map(transactions => 
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      ),
      catchError(error => {
        console.error('Erreur lors du chargement des transactions:', error);
        this.error.next('Impossible de charger les transactions. Veuillez réessayer.');
        this.loading.next(false); // Arrêter explicitement le chargement en cas d'erreur
        return of([]);
      })
    );
    
    // Initialisation des transactions filtrées
    this.filteredTransactions$ = this.transactions$;
    
    // Abonnement pour s'assurer que le chargement s'arrête et détecter les erreurs
    const transactionsSub = this.transactions$.subscribe({
      next: (transactions) => {
        // S'assurer que le chargement est terminé
        this.loading.next(false);
        
        if (transactions.length === 0) {
          // Vérifier si c'est dû à une erreur ou s'il n'y a réellement pas de transactions
          if (!this.error.getValue()) {
            console.log('Aucune transaction trouvée');
          }
        }
      },
      error: () => {
        // S'assurer que le chargement s'arrête en cas d'erreur
        this.loading.next(false);
      },
      complete: () => {
        // S'assurer que le chargement s'arrête à la fin
        this.loading.next(false);
      }
    });
    
    this.subscriptions.push(transactionsSub);
  }
  
  filterByType(type: 'all' | 'deposit' | 'withdrawal' | 'transfer' | 'profit' | 'loss'): void {
    this.selectedType = type;
    this.applyFilters();
  }
  
  filterByCurrency(currency: Currency | 'all'): void {
    this.selectedCurrency = currency;
    this.applyFilters();
  }
  
  filterByAccount(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedAccountId = selectElement.value as string | 'all';
    this.applyFilters();
  }
  
  resetFilters(): void {
    this.selectedType = 'all';
    this.selectedCurrency = 'all';
    this.selectedAccountId = 'all';
    this.applyFilters();
  }
  
  // Optimisation des performances avec trackBy
  trackByTransactionId(index: number, transaction: TransactionWithAccountName): string {
    return transaction.id;
  }
  
  ngOnDestroy(): void {
    // Nettoyage des abonnements pour éviter les fuites mémoire
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private applyFilters(): void {
    // Indiquer que le filtrage est en cours
    this.loading.next(true);
    
    this.filteredTransactions$ = this.transactions$.pipe(
      map(transactions => {
        // Journalisation pour débogage
        console.log('Transactions avant filtrage:', transactions.length);
        
        // Si pas de transactions, retourner un tableau vide
        if (!transactions || transactions.length === 0) {
          console.log('Aucune transaction disponible');
          return [];
        }
        
        // Copie des transactions pour le filtrage
        let filtered = [...transactions];
        
        // Filter by type - gestion spéciale pour les transferts
        if (this.selectedType !== 'all') {
          if (this.selectedType === 'transfer') {
            // Pour les transferts, on affiche tous les transferts, qu'ils soient entrants ou sortants
            filtered = filtered.filter(t => t.type === 'transfer');
          } else {
            filtered = filtered.filter(t => t.type === this.selectedType);
          }
          console.log(`Après filtrage par type (${this.selectedType}):`, filtered.length);
        }
        
        // Filter by currency
        if (this.selectedCurrency !== 'all') {
          filtered = filtered.filter(t => t.currency === this.selectedCurrency);
          console.log(`Après filtrage par devise (${this.selectedCurrency}):`, filtered.length);
        }
        
        // Filter by account - amélioré pour inclure les transferts entrants
        if (this.selectedAccountId !== 'all') {
          filtered = filtered.filter(t => 
            t.accountId === this.selectedAccountId || 
            (t.type === 'transfer' && t.targetAccountId === this.selectedAccountId)
          );
          console.log(`Après filtrage par compte (${this.selectedAccountId}):`, filtered.length);
        }
        
        // Journalisation du résultat final
        console.log('Transactions après filtrage:', filtered.length);
        
        // Tri des transactions par date (plus récentes en premier)
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }),
      // Terminer le chargement après le filtrage
      finalize(() => {
        // Mettre à jour l'état de chargement
        setTimeout(() => {
          this.loading.next(false);
        }, 0);
      })
    );
  }
  
  getTotalAmount(transactions: TransactionWithAccountName[]): { [key in Currency]: number } {
    return transactions.reduce((totals, transaction) => {
      // S'assurer que la devise existe dans l'objet totals
      const currency = transaction.currency;
      if (!totals[currency]) {
        totals[currency] = 0;
      }
      
      // Conversion explicite en nombre pour éviter les erreurs de concaténation de chaînes
      const amount = Number(transaction.amount);
      
      // Vérifier que le montant est un nombre valide
      if (isNaN(amount)) {
        console.error('Montant invalide détecté:', transaction);
        return totals; // Ignorer cette transaction
      }
      
      // Calcul du total en fonction du type de transaction et du compte sélectionné
      if (transaction.type === 'deposit' || transaction.type === 'profit') {
        totals[currency] += amount;
      } else if (transaction.type === 'withdrawal' || transaction.type === 'loss') {
        totals[currency] -= amount;
      } else if (transaction.type === 'transfer') {
        // Pour les transferts, il faut tenir compte du compte sélectionné
        if (this.selectedAccountId === 'all') {
          // Si tous les comptes sont sélectionnés, le transfert n'affecte pas le total
        } else if (transaction.accountId === this.selectedAccountId) {
          // Si c'est un transfert sortant du compte sélectionné
          totals[currency] -= amount;
        } else if (transaction.targetAccountId === this.selectedAccountId) {
          // Si c'est un transfert entrant vers le compte sélectionné
          totals[currency] += amount;
        }
      }
      
      return totals;
    }, {} as { [key in Currency]: number });
  }
  
  refreshData(): void {
    // Indiquer que le chargement est en cours
    this.loading.next(true);
    this.error.next(null);
    
    // Forcer le rechargement des données depuis le service
    this.transactionService.refreshTransactions();
    this.accountService.refreshAccounts();
    
    // Notification de succès
    this.notificationService.success('Données actualisées');
  }
  
  // Méthode pour obtenir le libellé du type de transaction
  getTransactionTypeLabel(type: string): string {
    switch (type) {
      case 'deposit':
        return 'Dépôt';
      case 'withdrawal':
        return 'Retrait';
      case 'profit':
        return 'Profit';
      case 'loss':
        return 'Perte';
      case 'transfer':
        return 'Transfert';
      default:
        return 'Transaction';
    }
  }
  
  editTransaction(transaction: TransactionWithAccountName): void {
    // Stocker la transaction à éditer dans le service
    this.transactionService.setTransactionToEdit(transaction);
    
    // Rediriger vers la page du compte avec le formulaire de transaction ouvert en mode édition
    this.router.navigate(['/accounts', transaction.accountId], {
      queryParams: {
        editTransaction: transaction.id,
        scroll: 'true'
      }
    });
  }
  
  // Méthode pour afficher la confirmation de suppression
  deleteTransaction(transaction: TransactionWithAccountName): void {
    this.transactionToDelete = transaction;
    this.showDeleteConfirmation = true;
  }
  
  // Méthode pour confirmer la suppression
  confirmDelete(): void {
    if (!this.transactionToDelete) return;
    
    // Indiquer que le chargement est en cours
    this.loading.next(true);
    
    this.transactionService.deleteTransaction(this.transactionToDelete.id).subscribe({
      next: () => {
        this.notificationService.success('Transaction supprimée avec succès');
        // Fermer le modal de confirmation
        this.cancelDelete();
        // Pas besoin de recharger les transactions manuellement car le service s'en charge
      },
      error: (error) => {
        console.error('Erreur lors de la suppression de la transaction:', error);
        this.notificationService.error('Erreur lors de la suppression de la transaction');
        this.loading.next(false);
        // Fermer le modal de confirmation
        this.cancelDelete();
      }
    });
  }
  
  // Méthode pour annuler la suppression
  cancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.transactionToDelete = null;
  }
}
