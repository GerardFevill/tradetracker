import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Transaction } from '../../models/transaction.model';

// Étendre l'interface Transaction pour inclure les noms des comptes
interface TransactionWithAccountName extends Transaction {
  accountName: string;
  targetAccountName?: string;
}

@Component({
  selector: 'app-transaction-item',
  templateUrl: './transaction-item.component.html',
  styleUrls: ['./transaction-item.component.css']
})
export class TransactionItemComponent implements OnInit {
  @Input() transaction!: TransactionWithAccountName;
  @Input() selectedAccountId: string | 'all' = 'all';
  @Output() delete = new EventEmitter<TransactionWithAccountName>();
  @Output() edit = new EventEmitter<TransactionWithAccountName>();

  constructor() { }

  ngOnInit(): void {
  }

  // Calcul du type d'icône à afficher
  getIconClass(): string {
    if (this.transaction.type === 'deposit' || 
        (this.transaction.type === 'profit') || 
        (this.transaction.type === 'transfer' && this.transaction.targetAccountId === this.selectedAccountId && this.selectedAccountId !== 'all')) {
      return 'deposit-icon';
    } else if (this.transaction.type === 'withdrawal' || 
               this.transaction.type === 'loss' || 
               (this.transaction.type === 'transfer' && this.transaction.accountId === this.selectedAccountId && this.transaction.targetAccountId !== this.selectedAccountId)) {
      return 'withdrawal-icon';
    } else {
      return 'transfer-icon';
    }
  }

  // Obtenir l'icône appropriée
  getIcon(): string {
    if (this.transaction.type === 'deposit' || this.transaction.type === 'profit') {
      return '↑';
    } else if (this.transaction.type === 'withdrawal' || this.transaction.type === 'loss') {
      return '↓';
    } else if (this.transaction.type === 'transfer') {
      // Si on affiche tous les comptes (pas de filtre par compte)
      if (this.selectedAccountId === 'all') {
        return '↔'; // Flèche bidirectionnelle pour les transferts sans filtre de compte
      }
      // Si c'est un transfert entrant vers le compte sélectionné
      else if (this.transaction.targetAccountId === this.selectedAccountId) {
        return '↑'; // Flèche vers le haut pour les transferts entrants
      } 
      // Si c'est un transfert sortant du compte sélectionné
      else if (this.transaction.accountId === this.selectedAccountId) {
        return '↓'; // Flèche vers le bas pour les transferts sortants
      } 
      // Cas par défaut (ne devrait pas arriver)
      else {
        return '↔';
      }
    }
    return '';
  }

  // Obtenir le libellé du type de transaction
  getTransactionTypeLabel(): string {
    switch (this.transaction.type) {
      case 'deposit':
        return 'Dépôt';
      case 'withdrawal':
        return 'Retrait';
      case 'profit':
        return 'Profit';
      case 'loss':
        return 'Perte';
      case 'transfer':
        // Si on affiche tous les comptes (pas de filtre par compte)
        if (this.selectedAccountId === 'all') {
          return 'Transfert';
        }
        // Si c'est un transfert entrant vers le compte sélectionné
        else if (this.transaction.targetAccountId === this.selectedAccountId) {
          return 'Transfert entrant';
        } 
        // Si c'est un transfert sortant du compte sélectionné
        else if (this.transaction.accountId === this.selectedAccountId) {
          return 'Transfert sortant';
        } 
        // Cas par défaut
        else {
          return 'Transfert';
        }
      default:
        return 'Transaction';
    }
  }

  // Obtenir la classe CSS pour le montant
  getAmountClass(): string {
    // Pour les dépôts et profits, toujours positif
    if (this.transaction.type === 'deposit' || this.transaction.type === 'profit') {
      return 'positive';
    } 
    // Pour les retraits et pertes, toujours négatif
    else if (this.transaction.type === 'withdrawal' || this.transaction.type === 'loss') {
      return 'negative';
    } 
    // Pour les transferts, ça dépend du contexte
    else if (this.transaction.type === 'transfer') {
      // Si on affiche tous les comptes (pas de filtre par compte)
      if (this.selectedAccountId === 'all') {
        return 'neutral'; // Neutre quand on voit tous les comptes
      }
      // Si c'est un transfert entrant vers le compte sélectionné
      else if (this.transaction.targetAccountId === this.selectedAccountId) {
        return 'positive'; // Positif pour les transferts entrants
      } 
      // Si c'est un transfert sortant du compte sélectionné
      else if (this.transaction.accountId === this.selectedAccountId) {
        return 'negative'; // Négatif pour les transferts sortants
      } 
      // Cas par défaut
      else {
        return 'neutral';
      }
    } 
    // Cas par défaut
    else {
      return 'neutral';
    }
  }

  // Obtenir le préfixe du montant (+ ou -)
  getAmountPrefix(): string {
    // Pour les dépôts et profits, toujours positif
    if (this.transaction.type === 'deposit' || this.transaction.type === 'profit') {
      return '+';
    } 
    // Pour les retraits et pertes, toujours négatif
    else if (this.transaction.type === 'withdrawal' || this.transaction.type === 'loss') {
      return '-';
    } 
    // Pour les transferts, ça dépend du contexte
    else if (this.transaction.type === 'transfer') {
      // Si on affiche tous les comptes (pas de filtre par compte)
      if (this.selectedAccountId === 'all') {
        return ''; // Pas de préfixe quand on voit tous les comptes
      }
      // Si c'est un transfert entrant vers le compte sélectionné
      else if (this.transaction.targetAccountId === this.selectedAccountId) {
        return '+'; // Positif pour les transferts entrants
      } 
      // Si c'est un transfert sortant du compte sélectionné
      else if (this.transaction.accountId === this.selectedAccountId) {
        return '-'; // Négatif pour les transferts sortants
      }
    }
    return '';
  }

  onEdit(): void {
    this.edit.emit(this.transaction);
  }

  onDelete(): void {
    this.delete.emit(this.transaction);
  }
}
