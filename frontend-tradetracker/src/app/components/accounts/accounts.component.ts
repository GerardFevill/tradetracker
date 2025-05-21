import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AccountService } from '../../services/account.service';
import { Account, Currency } from '../../models/account.model';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService, NotificationType } from '../../services/notification.service';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent implements OnInit {
  accounts$!: Observable<Account[]>;
  filteredAccounts$!: Observable<Account[]>;
  selectedCurrency: Currency | 'all' = 'all';
  selectedBroker: string | 'all' = 'all';
  
  // Pour la gestion du menu déroulant
  activeDropdown: string | null = null;
  
  // Pour la confirmation par email
  showDeleteConfirmation = false;
  accountToDelete: string | null = null;
  accountToDeleteInfo: Account | null = null;
  emailForm!: FormGroup;
  deleteError = '';

  constructor(
    private accountService: AccountService,
    private router: Router,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.accounts$ = this.accountService.getAccounts();
    this.filteredAccounts$ = this.accounts$;
    
    // Initialiser le formulaire de confirmation par email
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  filterByCurrency(currency: Currency | 'all'): void {
    this.selectedCurrency = currency;
    this.applyFilters();
  }

  filterByBroker(broker: string | 'all'): void {
    this.selectedBroker = broker;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered$ = this.accounts$;

    if (this.selectedCurrency !== 'all') {
      filtered$ = this.accountService.getAccountsByCurrency(this.selectedCurrency as Currency);
    }

    if (this.selectedBroker !== 'all' && this.selectedCurrency !== 'all') {
      // We need to filter the already currency-filtered accounts by broker
      this.filteredAccounts$ = filtered$.pipe(
        map((accounts: Account[]) => accounts.filter((account: Account) => account.broker === this.selectedBroker))
      );
    } else if (this.selectedBroker !== 'all') {
      // Just filter by broker
      this.filteredAccounts$ = this.accountService.getAccountsByBroker(this.selectedBroker);
    } else {
      // No broker filter, just use the currency filter (or all accounts if no currency filter)
      this.filteredAccounts$ = filtered$;
    }
  }

  /**
   * Ouvre la boîte de dialogue de confirmation par email pour la suppression
   */
  deleteAccount(id: string): void {
    this.accountToDelete = id;
    
    // Récupérer les informations du compte à supprimer
    this.accounts$.pipe(
      map(accounts => accounts.find(account => account.id === id))
    ).subscribe(account => {
      if (account) {
        this.accountToDeleteInfo = account;
        this.showDeleteConfirmation = true;
        this.deleteError = '';
        this.emailForm.reset();
      }
    });
  }
  
  /**
   * Confirme la suppression du compte
   */
  confirmDelete(): void {
    if (this.accountToDelete) {
      // Supprimer le compte
      this.accountService.deleteAccount(this.accountToDelete).subscribe(
        () => {
          this.cancelDelete();
          // Afficher une notification de succès
          this.notificationService.success('Le compte a été supprimé avec succès.');
        },
        (error) => {
          this.deleteError = 'Une erreur est survenue lors de la suppression. Veuillez réessayer.';
          // Afficher une notification d'erreur
          this.notificationService.error('Erreur lors de la suppression du compte. Veuillez réessayer.');
          console.error('Erreur de suppression:', error);
        }
      );
    } else {
      this.deleteError = 'Aucun compte à supprimer n\'a été sélectionné.';
      // Afficher une notification d'avertissement
      this.notificationService.warning('Aucun compte à supprimer n\'a été sélectionné.');
    }
  }
  
  /**
   * Annule la suppression et ferme la boîte de dialogue
   */
  cancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.accountToDelete = null;
    this.emailForm.reset();
  }
  
  /**
   * Redirige vers la page de détails du compte sans défilement automatique
   */
  viewAccountDetails(accountId: string): void {
    this.router.navigate(['/accounts', accountId]);
  }

  /**
   * Redirige vers la page de détails du compte avec le formulaire de dépôt ouvert
   */
  addDeposit(accountId: string): void {
    this.router.navigate(['/accounts', accountId], { 
      queryParams: { 
        action: 'deposit',
        scroll: 'true' 
      } 
    });
    this.notificationService.info('Préparation du formulaire de dépôt...');
  }
  
  /**
   * Redirige vers la page de détails du compte avec le formulaire de retrait ouvert
   */
  addWithdrawal(accountId: string): void {
    this.router.navigate(['/accounts', accountId], { 
      queryParams: { 
        action: 'withdrawal',
        scroll: 'true' 
      } 
    });
    this.notificationService.info('Préparation du formulaire de retrait...');
  }
  
  /**
   * Redirige vers la page de détails du compte avec le formulaire de transfert ouvert
   */
  transferFunds(accountId: string): void {
    // Récupérer les informations du compte pour le transfert
    this.accountService.getAccountById(accountId).subscribe(
      account => {
        if (account) {
          this.router.navigate(['/accounts', accountId], { 
            queryParams: { 
              action: 'transfer',
              sourceId: accountId,
              sourceName: account.name,
              scroll: 'true'
            } 
          });
          this.notificationService.info('Préparation du formulaire de transfert...');
        }
      },
      error => {
        this.notificationService.error('Erreur lors de la récupération des informations du compte.');
        console.error('Erreur de récupération du compte:', error);
      }
    );
  }
  
  /**
   * Redirige vers la page de détails du compte avec le formulaire de gain ouvert
   */
  addProfit(accountId: string): void {
    this.router.navigate(['/accounts', accountId], { 
      queryParams: { 
        action: 'profit',
        scroll: 'true' 
      } 
    });
    this.notificationService.info('Préparation du formulaire d’enregistrement de gain...');
  }
  
  /**
   * Redirige vers la page de détails du compte avec le formulaire de perte ouvert
   */
  addLoss(accountId: string): void {
    this.router.navigate(['/accounts', accountId], { 
      queryParams: { 
        action: 'loss',
        scroll: 'true' 
      } 
    });
    this.notificationService.info('Préparation du formulaire d’enregistrement de perte...');
  }
  
  /**
   * Ouvre ou ferme le menu déroulant pour un compte spécifique
   * @param accountId ID du compte ou null pour fermer tous les menus
   * @param event Événement de clic pour positionner le menu
   */
  toggleDropdown(accountId: string | null, event?: MouseEvent): void {
    if (this.activeDropdown === accountId) {
      // Si le menu est déjà ouvert pour ce compte, le fermer
      this.activeDropdown = null;
    } else {
      // Sinon, ouvrir le menu pour ce compte
      this.activeDropdown = accountId;
      
      // Positionner le menu déroulant après un court délai pour s'assurer que le DOM est mis à jour
      if (event && accountId) {
        setTimeout(() => {
          const button = event.target as HTMLElement;
          const menu = document.querySelector('.custom-dropdown-menu.show') as HTMLElement;
          
          if (menu && button) {
            const buttonRect = button.getBoundingClientRect();
            menu.style.position = 'fixed';
            menu.style.top = (buttonRect.bottom + 5) + 'px';
            menu.style.left = buttonRect.left + 'px';
            menu.style.zIndex = '99999';
          }
        }, 0);
      }
    }
  }
}
