import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, switchMap, tap, of, map } from 'rxjs';
import { AccountService } from '../../services/account.service';
import { TransactionService } from '../../services/transaction.service';
import { AnalyticsService } from '../../services/analytics.service';
import { WithdrawalStrategyService } from '../../services/withdrawal-strategy.service';
import { NotificationService } from '../../services/notification.service';
import { Account } from '../../models/account.model';
import { Transaction } from '../../models/transaction.model';
import { WithdrawalRecommendation } from '../../models/withdrawal-rule.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.css']
})
export class AccountDetailComponent implements OnInit {
  account$!: Observable<Account | undefined>;
  account: Account | undefined;
  transactions$!: Observable<Transaction[]>;
  performance$!: Observable<number>;
  profitLoss$!: Observable<number>;
  roi$!: Observable<number>;
  withdrawalSuggestion$!: Observable<number>;
  
  // Recommandation de retrait intelligent
  withdrawalRecommendation$!: Observable<WithdrawalRecommendation | null>;
  
  // Liste des comptes disponibles pour les transferts
  availableAccounts$!: Observable<Account[]>;
  
  transactionForm!: FormGroup;
  thresholdForm!: FormGroup;
  targetForm!: FormGroup;
  
  showTransactionForm = false;
  showTargetForm = false;
  
  // Mode d'édition pour le formulaire de transaction
  isEditMode = false;
  currentTransactionId: string | null = null;
  
  // Pour stocker les noms des comptes pour les transferts
  private accountNames: {[id: string]: string} = {};
  accounts: Account[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private transactionService: TransactionService,
    private analyticsService: AnalyticsService,
    private withdrawalStrategyService: WithdrawalStrategyService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const accountId = this.route.snapshot.paramMap.get('id');
    
    if (!accountId) {
      this.router.navigate(['/accounts']);
      return;
    }
    
    // Vérifier s'il y a une action spécifiée dans les paramètres de requête
    const action = this.route.snapshot.queryParamMap.get('action');
    const shouldScroll = this.route.snapshot.queryParamMap.get('scroll') === 'true';
    const editTransactionId = this.route.snapshot.queryParamMap.get('editTransaction');
    
    // Vérifier si on doit éditer une transaction existante
    if (editTransactionId) {
      // Charger les données du compte et des transactions d'abord
      this.loadAccountDetails();
      
      // Attendre que les transactions soient chargées avant de chercher celle à éditer
      this.transactions$.subscribe(transactions => {
        const transactionToEdit = transactions.find(t => t.id === editTransactionId);
        if (transactionToEdit) {
          // Ouvrir le formulaire en mode édition avec la transaction trouvée
          this.editTransaction(transactionToEdit);
        }
      });
    }
    // Sinon, vérifier s'il y a une action pour ajouter une nouvelle transaction
    else if (action === 'deposit' || action === 'transfer' || action === 'withdrawal' || action === 'profit' || action === 'loss') {
      this.showTransactionForm = true;
      
      // Définir le type de transaction en fonction de l'action
      const transactionData: any = {
        type: action
      };
      
      // Si c'est un transfert, ajouter des informations supplémentaires
      if (action === 'transfer') {
        const sourceId = this.route.snapshot.queryParamMap.get('sourceId');
        const sourceName = this.route.snapshot.queryParamMap.get('sourceName');
        
        if (sourceId) {
          transactionData.description = `Transfert depuis ${sourceName || 'un autre compte'}`;
        }
      }
      
      // Initialiser le formulaire avec un délai pour s'assurer qu'il est créé
      setTimeout(() => {
        this.transactionForm.patchValue(transactionData);
        
        // Faire défiler uniquement si le paramètre scroll est présent
        if (shouldScroll) {
          setTimeout(() => {
            // Cibler le titre "Historique des Transactions"
            const titleElement = document.getElementById('transactions-title');
            if (titleElement) {
              // Calculer la position du titre par rapport au haut de la page
              const rect = titleElement.getBoundingClientRect();
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              const titlePosition = rect.top + scrollTop;
              
              // Tenir compte de la hauteur du menu (environ 60px) et ajouter un espace au-dessus
              const menuHeight = 60;
              const additionalSpace = 20; // Espace supplémentaire au-dessus du titre
              
              // Faire défiler jusqu'à la position calculée
              window.scrollTo({
                top: titlePosition - menuHeight - additionalSpace,
                behavior: 'smooth'
              });
            }
          }, 100);
        }
      }, 0);
    }
    
    // Charger tous les comptes pour avoir les noms disponibles pour les transferts
    this.availableAccounts$ = this.accountService.getAccounts().pipe(
      map(accounts => {
        // Stocker les noms des comptes pour l'affichage
        accounts.forEach(account => {
          this.accountNames[account.id] = account.name;
        });
        return accounts;
      })
    );
    
    this.account$ = this.accountService.getAccountById(accountId).pipe(
      tap(account => {
        if (account) {
          // Stocker l'instance du compte pour un accès facile
          this.account = account;
          
          // Initialiser le formulaire de seuil avec les valeurs actuelles
          this.thresholdForm = this.fb.group({
            threshold: [account.withdrawalThreshold || 0, [Validators.required, Validators.min(0)]]
          });
          
          // Initialiser le formulaire d'objectif avec les valeurs actuelles
          this.targetForm = this.fb.group({
            targetBalance: [account.targetBalance || 0, [Validators.required, Validators.min(0)]]
          });
        }
      })
    );
    
    this.transactions$ = this.transactionService.getTransactionsByAccount(accountId);
    this.performance$ = this.analyticsService.getAccountPerformance(accountId);
    this.profitLoss$ = this.analyticsService.getAccountProfitLoss(accountId);
    this.roi$ = this.analyticsService.getAccountROI(accountId);
    this.withdrawalSuggestion$ = this.analyticsService.getWithdrawalSuggestions(accountId);
    
    // Obtenir la recommandation de retrait intelligent
    this.withdrawalRecommendation$ = this.withdrawalStrategyService.getWithdrawalRecommendation(accountId);
    
    // Initialize transaction form
    this.initTransactionForm();
  }
  
  initTransactionForm(): void {
    this.transactionForm = this.fb.group({
      type: ['deposit', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      finalBalance: [''],
      description: [''],
      source: [''],
      targetAccountId: [''],
      date: [new Date().toISOString().slice(0, 16), Validators.required] // Format YYYY-MM-DDThh:mm
    });
    
    // Observer les changements du type de transaction
    this.transactionForm.get('type')?.valueChanges.subscribe(type => {
      // Si le type change vers profit ou loss, initialiser le solde final avec le solde actuel
      if (type === 'profit' || type === 'loss') {
        if (this.account) {
          this.transactionForm.get('finalBalance')?.setValue(this.account.currentBalance);
        }
      }
    });
  }
  
  updateThreshold(): void {
    if (this.thresholdForm.invalid) return;
    
    const accountId = this.route.snapshot.paramMap.get('id');
    if (!accountId) return;
    
    const { withdrawalThreshold } = this.thresholdForm.value;
    
    this.accountService.updateAccount(accountId, { withdrawalThreshold }).subscribe(
      () => {
        this.thresholdForm.reset({ withdrawalThreshold });
        this.notificationService.success('Seuil d\'alerte mis à jour avec succès.');
      },
      error => {
        this.notificationService.error('Erreur lors de la mise à jour du seuil d\'alerte.');
        console.error('Erreur de mise à jour du seuil:', error);
      }
    );
  }
  
  /**
   * Met à jour l'objectif du compte et recalcule les recommandations de retrait
   */
  updateTargetBalance(): void {
    if (this.targetForm.invalid) return;
    
    const accountId = this.route.snapshot.paramMap.get('id');
    if (!accountId) return;
    
    const { targetBalance } = this.targetForm.value;
    
    this.accountService.updateAccount(accountId, { targetBalance }).subscribe(
      () => {
        this.targetForm.reset({ targetBalance });
        this.showTargetForm = false;
        
        // Recalculer les recommandations de retrait avec le nouvel objectif
        this.account$.pipe(
          switchMap(account => {
            if (!account) return of(null);
            return this.withdrawalStrategyService.getWithdrawalRecommendation(account);
          })
        ).subscribe(recommendation => {
          this.withdrawalRecommendation$ = of(recommendation);
          this.notificationService.success('Objectif mis à jour avec succès. Les recommandations de retrait ont été recalculées.');
        });
      },
      error => {
        this.notificationService.error('Erreur lors de la mise à jour de l\'objectif.');
        console.error('Erreur de mise à jour de l\'objectif:', error);
      }
    );
  }
  
  /**
   * Ouvre ou ferme le formulaire de transaction
   * @param type Type de transaction à initialiser (optionnel)
   * @param amount Montant initial (optionnel)
   * @param description Description initiale (optionnel)
   * @param scroll Indique s'il faut défiler jusqu'au formulaire (optionnel)
   */
  toggleTransactionForm(type?: string, amount?: number, description?: string, scroll: boolean = true): void {
    // Si on ferme le formulaire, réinitialiser le mode d'édition
    if (this.showTransactionForm) {
      this.showTransactionForm = false;
      this.isEditMode = false;
      this.currentTransactionId = null;
      return;
    }
    
    // Ouvrir le formulaire
    this.showTransactionForm = true;
    
    // Valeurs par défaut
    const defaultValues = { 
      type: type || 'deposit', 
      amount: amount || 0, 
      finalBalance: '',
      date: new Date().toISOString().slice(0, 16), // Format YYYY-MM-DDThh:mm pour input datetime-local
      description: description || '', 
      source: '',
      targetAccountId: ''
    };
    
    // Si le type est profit ou loss, initialiser le solde final avec le solde actuel
    if ((type === 'profit' || type === 'loss') && this.account) {
      defaultValues.finalBalance = this.account.currentBalance.toString();
    }
    
    // Réinitialiser le formulaire avec les valeurs spécifiées ou par défaut
    this.transactionForm.reset(defaultValues);
    this.isEditMode = false;
    this.currentTransactionId = null;
    
    // Faire défiler jusqu'au titre "Historique des Transactions" si demandé
    if (scroll) {
      setTimeout(() => {
        // Cibler le titre "Historique des Transactions"
        const titleElement = document.getElementById('transactions-title');
        if (titleElement) {
          // Calculer la position du titre par rapport au haut de la page
          const rect = titleElement.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const titlePosition = rect.top + scrollTop;
          
          // Tenir compte de la hauteur du menu (environ 60px) et ajouter un espace au-dessus
          const menuHeight = 60;
          const additionalSpace = 20; // Espace supplémentaire au-dessus du titre
          
          // Faire défiler jusqu'à la position calculée
          window.scrollTo({
            top: titlePosition - menuHeight - additionalSpace,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }
  /**
   * Recharge les données du compte et des transactions
   */
  loadAccountDetails(): void {
    const accountId = this.route.snapshot.paramMap.get('id');
    if (!accountId) {
      this.router.navigate(['/accounts']);
      return;
    }
    
    // Recharger les détails du compte
    this.account$ = this.accountService.getAccountById(accountId).pipe(
      tap(account => {
        if (account) {
          this.account = account;
        }
      })
    );
    
    // Recharger les transactions
    this.transactions$ = this.transactionService.getTransactionsByAccount(accountId);
    
    // Recalculer les métriques
    // Note: Ces méthodes doivent être implémentées dans le service AnalyticsService
    // Pour l'instant, nous utilisons des observables vides
    this.performance$ = of(0);
    this.profitLoss$ = of(0);
    this.roi$ = of(0);
    this.withdrawalRecommendation$ = this.withdrawalStrategyService.getWithdrawalRecommendation(accountId);
  }
  
  /**
   * Ajoute ou met à jour une transaction
   */
  addTransaction(): void {
    if (this.transactionForm.invalid) {
      return;
    }

    const accountId = this.route.snapshot.paramMap.get('id');
    if (!accountId) {
      this.notificationService.error('Impossible d\'ajouter une transaction sans compte');
      this.router.navigate(['/accounts']);
      return;
    }

    const { type, amount, description, source, targetAccountId, date } = this.transactionForm.value;
    
    // Récupérer les informations du compte
    this.account$.pipe(
      switchMap(account => {
        if (!account) {
          this.notificationService.error('Compte introuvable');
          return of(null);
        }
        
        // Créer l'objet transaction
        const transactionData: Omit<Transaction, 'id'> = {
          accountId,
          type,
          amount,
          currency: account.currency,
          date: date ? new Date(date) : new Date(),
          description,
          ...(type !== 'transfer' ? { source } : {})
        };
        
        // Si c'est un transfert, ajouter l'ID du compte cible
        if (type === 'transfer' && targetAccountId) {
          (transactionData as any).targetAccountId = targetAccountId;
          
          // Vérifier que les devises sont compatibles
          this.accountService.getAccountById(targetAccountId).subscribe(targetAccount => {
            if (targetAccount && targetAccount.currency !== account.currency) {
              this.notificationService.warning(`Attention: Transfert entre comptes de devises différentes (${account.currency} → ${targetAccount.currency})`);
            }
          });
        }
        
        // Déterminer s'il s'agit d'une création ou d'une mise à jour
        if (this.isEditMode && this.currentTransactionId) {
          // Mise à jour d'une transaction existante
          return this.transactionService.updateTransaction(this.currentTransactionId, transactionData);
        } else {
          // Création d'une nouvelle transaction
          return this.transactionService.addTransaction(transactionData);
        }
      })
    ).subscribe(
      (result) => {
        if (result) {
          const { type, amount } = this.transactionForm.value;
          
          // Afficher une notification en fonction du type de transaction et du mode d'édition
          if (this.isEditMode) {
            this.notificationService.success('Transaction mise à jour avec succès.');
          } else {
            switch(type) {
              case 'deposit':
                this.notificationService.success(`Dépôt de ${amount} ${this.account?.currency || ''} effectué avec succès.`);
                break;
              case 'withdrawal':
                this.notificationService.success(`Retrait de ${amount} ${this.account?.currency || ''} effectué avec succès.`);
                break;
              case 'transfer':
                this.notificationService.success(`Transfert de ${amount} ${this.account?.currency || ''} effectué avec succès.`);
                break;
              case 'profit':
                this.notificationService.success(`Gain de trading de ${amount} ${this.account?.currency || ''} enregistré avec succès.`);
                break;
              case 'loss':
                this.notificationService.warning(`Perte de trading de ${amount} ${this.account?.currency || ''} enregistrée avec succès.`);
                break;
              default:
                this.notificationService.success('Transaction effectuée avec succès.');
            }
          }
          
          // Fermer le formulaire
          this.toggleTransactionForm();
          
          // Recharger les données du compte
          this.loadAccountDetails();
        }
      },
      error => {
        // Afficher un message d'erreur différent selon le mode (ajout ou édition)
        if (this.isEditMode) {
          this.notificationService.error('Erreur lors de la mise à jour de la transaction.');
        } else {
          this.notificationService.error('Erreur lors de l\'ajout de la transaction.');
        }
        console.error('Erreur de transaction:', error);
        
        // Recharger les données du compte pour s'assurer que l'interface est à jour
        this.loadAccountDetails();
      }
    );
  }
  
  /**
   * Calcule le montant de la transaction à partir du solde final souhaité
   */
  calculateAmountFromFinalBalance(): void {
    if (!this.account) return;
    
    const finalBalance = this.transactionForm.get('finalBalance')?.value;
    if (finalBalance === null || finalBalance === undefined || finalBalance === '') return;
    
    const currentBalance = this.account.currentBalance;
    const type = this.transactionForm.get('type')?.value;
    
    // Calculer le montant en fonction du type de transaction
    if (type === 'profit') {
      // Pour un gain, le montant est la différence positive entre le solde final et le solde actuel
      const amount = Math.max(0, finalBalance - currentBalance);
      this.transactionForm.get('amount')?.setValue(amount.toFixed(2));
    } else if (type === 'loss') {
      // Pour une perte, le montant est la différence positive entre le solde actuel et le solde final
      const amount = Math.max(0, currentBalance - finalBalance);
      this.transactionForm.get('amount')?.setValue(amount.toFixed(2));
    }
  }
  
  /**
   * Calcule le solde final à partir du montant de la transaction
   */
  calculateFinalBalanceFromAmount(): void {
    if (!this.account) return;
    
    const amount = this.transactionForm.get('amount')?.value;
    if (amount === null || amount === undefined || amount === '') return;
    
    const currentBalance = this.account.currentBalance;
    const type = this.transactionForm.get('type')?.value;
    
    // Calculer le solde final en fonction du type de transaction
    if (type === 'profit') {
      // Pour un gain, le solde final est le solde actuel + le montant
      const finalBalance = currentBalance + parseFloat(amount);
      this.transactionForm.get('finalBalance')?.setValue(finalBalance.toFixed(2));
    } else if (type === 'loss') {
      // Pour une perte, le solde final est le solde actuel - le montant
      const finalBalance = currentBalance - parseFloat(amount);
      this.transactionForm.get('finalBalance')?.setValue(finalBalance.toFixed(2));
    }
  }
  
  /**
   * Prépare le formulaire pour éditer une transaction existante
   * @param transaction La transaction à éditer
   */
  editTransaction(transaction: Transaction): void {
    // Ouvrir le formulaire en mode édition
    this.isEditMode = true;
    this.currentTransactionId = transaction.id;
    this.showTransactionForm = true;
    
    // Formater la date pour le champ datetime-local
    const transactionDate = new Date(transaction.date);
    const formattedDate = transactionDate.toISOString().slice(0, 16); // Format YYYY-MM-DDThh:mm
    
    // Remplir le formulaire avec les données de la transaction
    this.transactionForm.patchValue({
      type: transaction.type,
      amount: transaction.amount,
      date: formattedDate,
      description: transaction.description || '',
      source: transaction.source || '',
      targetAccountId: transaction.targetAccountId || ''
    });
    
    // Faire défiler jusqu'au titre "Historique des Transactions"
    setTimeout(() => {
      // Cibler le titre "Historique des Transactions"
      const titleElement = document.getElementById('transactions-title');
      if (titleElement) {
        // Calculer la position du titre par rapport au haut de la page
        const rect = titleElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const titlePosition = rect.top + scrollTop;
        
        // Tenir compte de la hauteur du menu (environ 60px) et ajouter un espace au-dessus
        const menuHeight = 60;
        const additionalSpace = 20; // Espace supplémentaire au-dessus du titre
        
        // Faire défiler jusqu'à la position calculée
        window.scrollTo({
          top: titlePosition - menuHeight - additionalSpace,
          behavior: 'smooth'
        });
      }
    }, 100);
  }
  
  /**
   * Récupère le nom d'un compte à partir de son ID
   */
  getAccountName(accountId: string): string {
    return this.accountNames[accountId] || `Compte ${accountId}`;
  }
}
