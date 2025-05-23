import { Component, OnInit, Input } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-balance-history',
  templateUrl: './balance-history.component.html',
  styleUrls: ['./balance-history.component.css']
})
export class BalanceHistoryComponent implements OnInit {
  balanceHistory: {month: string, usd: number, eur: number}[] = [];
  selectedPeriod: string = '1y';

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadBalanceHistory();
  }

  // Méthode pour changer la période d'affichage du graphique
  changePeriod(period: string): void {
    if (this.selectedPeriod !== period) {
      this.selectedPeriod = period;
      this.loadBalanceHistory();
    }
  }

  // Méthode pour charger l'historique des soldes avec la période sélectionnée
  loadBalanceHistory(): void {
    this.analyticsService.getBalanceHistoryByPeriod(this.selectedPeriod).subscribe(data => {
      this.balanceHistory = data;
    });
  }

  // Méthode pour calculer la valeur maximale pour l'échelle du graphique
  getMaxValue(): number {
    if (this.balanceHistory.length === 0) return 10000; // Valeur par défaut si aucune donnée
    
    // Trouver la valeur maximale dans les données d'historique pour USD et EUR
    let maxUSD = Math.max(...this.balanceHistory.map(item => Math.abs(item.usd)));
    let maxEUR = Math.max(...this.balanceHistory.map(item => Math.abs(item.eur)));
    
    // Prendre la valeur maximale entre USD et EUR
    let max = Math.max(maxUSD, maxEUR);
    
    // Arrondir à la centaine supérieure pour avoir une échelle propre
    return Math.ceil(max / 100) * 100;
  }

  // Calcule la hauteur de la barre en pourcentage (max 45%)
  getBarHeight(value: number): number {
    const maxHeight = 45; // Hauteur maximale en pourcentage
    
    // Trouver la valeur absolue maximale (positive ou négative) dans les données
    const allValues = this.balanceHistory.flatMap(d => [d.usd, d.eur]);
    const maxAbsValue = Math.max(...allValues.map(v => Math.abs(v)));
    
    if (allValues.length === 0 || maxAbsValue === 0) {
      return 0; // Éviter la division par zéro
    }
    
    // Calculer la hauteur proportionnelle à la valeur absolue
    // Limiter la hauteur à maxHeight pour les valeurs positives et négatives
    const height = Math.abs(value) / maxAbsValue * maxHeight;
    return Math.min(height, maxHeight);
  }

  // Calcule la position verticale de la barre en fonction de si la valeur est positive ou négative
  getBarPosition(value: number): number {
    // La ligne zéro est à 50% de la hauteur du graphique
    const zeroLine = 50;
    
    if (value >= 0) {
      // Pour les valeurs positives : la barre commence à la ligne zéro et s'étend vers le haut
      // On soustrait la hauteur de la barre de la position de la ligne zéro
      return zeroLine - this.getBarHeight(value);
    } else {
      // Pour les valeurs négatives : la barre commence à la ligne zéro et s'étend vers le bas
      // La position reste à la ligne zéro
      return zeroLine;
    }
  }
}
