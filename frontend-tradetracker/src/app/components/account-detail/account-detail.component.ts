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
  
  // Pour stocker les noms des comptes pour les transferts
  private accountNames: {[id: string]: string} = {};
  
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
    
    if (action === 'deposit' || action === 'transfer' || action === 'withdrawal') {
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
            // Cibler directement le titre de la section
            const titleElement = document.getElementById('transactions-title');
            if (titleElement) {
              // Calculer la position du titre par rapport au haut de la page
              const rect = titleElement.getBoundingClientRect();
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              const titlePosition = rect.top + scrollTop;
              
              // Tenir compte de la hauteur du menu (environ 60px)
              const menuHeight = 60;
              
              // Faire défiler jusqu'à la position calculée moins la hauteur du menu
              window.scrollTo({
                top: titlePosition - menuHeight - 20, // 20px d'espace supplémentaire
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
        if (!account) {
          this.router.navigate(['/accounts']);
          return;
        }
        
        // Initialize the threshold form with current threshold value
        this.thresholdForm = this.fb.group({
          withdrawalThreshold: [account.withdrawalThreshold, [Validators.required, Validators.min(0)]]
        });
        
        // Initialize the target form with current target balance
        this.targetForm = this.fb.group({
          targetBalance: [account.targetBalance, [Validators.required, Validators.min(100)]]
        });
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
    this.transactionForm = this.fb.group({
      type: ['deposit', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      description: [''],
      source: [''], // Nouveau champ pour l'origine des fonds
      targetAccountId: [''] // Champ pour le compte de destination lors d'un transfert
    });
    
    // Observer les changements du type de transaction pour ajouter/supprimer la validation du compte de destination
    this.transactionForm.get('type')?.valueChanges.subscribe(type => {
      const targetAccountControl = this.transactionForm.get('targetAccountId');
      if (type === 'transfer') {
        targetAccountControl?.setValidators([Validators.required]);
      } else {
        targetAccountControl?.clearValidators();
      }
      targetAccountControl?.updateValueAndValidity();
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
    this.showTransactionForm = !this.showTransactionForm;
    
    if (this.showTransactionForm) {
      // Valeurs par défaut
      const defaultValues = { 
        type: type || 'deposit', 
        amount: amount || 0, 
        description: description || '', 
        source: '' 
      };
      
      // Réinitialiser le formulaire avec les valeurs spécifiées ou par défaut
      this.transactionForm.reset(defaultValues);
      
      // Faire défiler jusqu'à la section d'historique des transactions si demandé
      if (scroll) {
        setTimeout(() => {
          // Cibler directement le titre de la section
          const titleElement = document.getElementById('transactions-title');
          if (titleElement) {
            // Calculer la position du titre par rapport au haut de la page
            const rect = titleElement.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const titlePosition = rect.top + scrollTop;
            
            // Tenir compte de la hauteur du menu (environ 60px)
            const menuHeight = 60;
            
            // Faire défiler jusqu'à la position calculée moins la hauteur du menu
            window.scrollTo({
              top: titlePosition - menuHeight - 20, // 20px d'espace supplémentaire
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    }
  }
  
  addTransaction(): void {
    if (this.transactionForm.invalid) {
      this.notificationService.warning('Veuillez remplir correctement tous les champs requis.');
      return;
    }
    
    const accountId = this.route.snapshot.paramMap.get('id');
    if (!accountId) {
      this.notificationService.error('ID de compte non trouvé.');
      return;
    }
    
    this.account$.pipe(
      switchMap(account => {
        if (!account) {
          this.notificationService.error('Compte non trouvé.');
          return of(null);
        }
        
        const { type, amount, description, source } = this.transactionForm.value;
        
        const transaction: Omit<Transaction, 'id'> = {
          accountId,
          type,
          amount,
          currency: account.currency,
          date: new Date(),
          description,
          // Ajouter le champ source uniquement pour les dépôts et retraits
          ...(type !== 'transfer' ? { source } : {})
        };
        
        // Si c'est un transfert, ajouter les informations supplémentaires
        if (type === 'transfer') {
          // Utiliser le compte de destination sélectionné par l'utilisateur
          const targetId = this.transactionForm.get('targetAccountId')?.value;
          if (targetId) {
            transaction.targetAccountId = targetId;
          } else {
            this.notificationService.warning('Veuillez sélectionner un compte de destination pour le transfert.');
            return of(null); // Ne pas procéder si aucun compte de destination n'est sélectionné
          }
          
          // Déterminer le taux de change en fonction des devises des comptes
          // Nous savons que targetAccountId est défini ici grâce à la vérification précédente
          this.accountService.getAccountById(transaction.targetAccountId!).subscribe(targetAccount => {
            if (targetAccount && targetAccount.currency !== account.currency) {
              // Taux de change entre USD et EUR
              transaction.exchangeRate = account.currency === 'USD' ? 0.91 : 1.1;
            } else {
              // Même devise, pas de conversion nécessaire
              transaction.exchangeRate = 1;
            }
          });
        }
        
        return this.transactionService.addTransaction(transaction);
      })
    ).subscribe(
      (result) => {
        if (result) {
          const { type, amount } = this.transactionForm.value;
          
          // Afficher une notification en fonction du type de transaction
          switch(type) {
            case 'deposit':
              this.notificationService.success(`Dépôt de ${amount} ${this.transactionForm.value.currency || ''} effectué avec succès.`);
              break;
            case 'withdrawal':
              this.notificationService.success(`Retrait de ${amount} ${this.transactionForm.value.currency || ''} effectué avec succès.`);
              break;
            case 'transfer':
              this.notificationService.success(`Transfert de ${amount} ${this.transactionForm.value.currency || ''} effectué avec succès.`);
              break;
            case 'profit':
              this.notificationService.success(`Gain de trading de ${amount} ${this.transactionForm.value.currency || ''} enregistré avec succès.`);
              break;
            case 'loss':
              this.notificationService.warning(`Perte de trading de ${amount} ${this.transactionForm.value.currency || ''} enregistrée avec succès.`);
              break;
            default:
              this.notificationService.success('Transaction effectuée avec succès.');
          }
          
          this.toggleTransactionForm();
          
          // Update account balance based on transaction
          this.account$.pipe(
            switchMap(account => {
              if (!account) return of(null);
              
              let newBalance = account.currentBalance;
              
              if (type === 'deposit') {
                newBalance += amount;
              } else if (type === 'withdrawal') {
                newBalance -= amount;
              } else if (type === 'transfer') {
                newBalance -= amount;
              } else if (type === 'profit') {
                newBalance += amount;
              } else if (type === 'loss') {
                newBalance -= amount;
              }
              
              return this.accountService.updateAccount(accountId!, { 
                currentBalance: newBalance,
                ...(type === 'deposit' ? { totalDeposits: account.totalDeposits + amount } : {}),
                ...(type === 'withdrawal' ? { totalWithdrawals: account.totalWithdrawals + amount } : {}),
                ...(type === 'profit' ? { totalProfits: (account.totalProfits || 0) + amount } : {}),
                ...(type === 'loss' ? { totalLosses: (account.totalLosses || 0) + amount } : {})
              });
            })
          ).subscribe(
            () => {},
            error => {
              this.notificationService.error('Erreur lors de la mise à jour du solde du compte.');
              console.error('Erreur de mise à jour du solde:', error);
            }
          );
        }
      },
      error => {
        this.notificationService.error('Erreur lors de l\'ajout de la transaction.');
        console.error('Erreur d\'ajout de transaction:', error);
      }
    );
  }
  
  /**
   * Récupère le nom d'un compte à partir de son ID
   */
  getAccountName(accountId: string): string {
    return this.accountNames[accountId] || `Compte ${accountId}`;
  }
}
