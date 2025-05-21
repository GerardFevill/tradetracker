import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AnalyticsService } from '../../services/analytics.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  exchangeRateForm!: FormGroup;
  displaySettingsForm!: FormGroup;
  withdrawalRulesForm!: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    private analyticsService: AnalyticsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForms();
  }
  
  private initForms(): void {
    // Exchange rate form
    this.exchangeRateForm = this.fb.group({
      eurToUsd: [1.1, [Validators.required, Validators.min(0.01)]],
      usdToEur: [0.91, [Validators.required, Validators.min(0.01)]]
    });
    
    // Display settings form
    this.displaySettingsForm = this.fb.group({
      defaultCurrency: ['USD', Validators.required],
      showPerformanceMetrics: [true],
      enableDarkMode: [false]
    });
    
    // Withdrawal rules form
    this.withdrawalRulesForm = this.fb.group({
      autoSuggestWithdrawals: [true],
      minWithdrawalAmount: [100, [Validators.required, Validators.min(0)]],
      keepPercentageOfProfit: [50, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }
  
  updateExchangeRates(): void {
    if (this.exchangeRateForm.invalid) {
      this.notificationService.warning('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }
    
    const { eurToUsd, usdToEur } = this.exchangeRateForm.value;
    this.analyticsService.setExchangeRates(eurToUsd, usdToEur);
    
    // In a real app, we would save this to the backend
    this.notificationService.success('Taux de change mis à jour avec succès');
  }
  
  updateDisplaySettings(): void {
    if (this.displaySettingsForm.invalid) {
      this.notificationService.warning('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }
    
    // In a real app, we would save this to the backend and apply the settings
    this.notificationService.success('Paramètres d\'affichage mis à jour avec succès');
  }
  
  updateWithdrawalRules(): void {
    if (this.withdrawalRulesForm.invalid) {
      this.notificationService.warning('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }
    
    // In a real app, we would save this to the backend
    this.notificationService.success('Règles de retrait mises à jour avec succès');
  }
  
  // Cette méthode n'est plus nécessaire car nous utilisons le service de notification
  // Elle est conservée pour compatibilité avec d'autres parties du code qui pourraient l'utiliser
  private showSuccessMessage(message: string): void {
    this.notificationService.success(message);
  }
}
