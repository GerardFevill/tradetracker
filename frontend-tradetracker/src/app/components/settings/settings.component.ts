import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AnalyticsService } from '../../services/analytics.service';

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
    private analyticsService: AnalyticsService
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
    if (this.exchangeRateForm.invalid) return;
    
    const { eurToUsd, usdToEur } = this.exchangeRateForm.value;
    this.analyticsService.setExchangeRates(eurToUsd, usdToEur);
    
    // In a real app, we would save this to the backend
    this.showSuccessMessage('Taux de change mis à jour avec succès');
  }
  
  updateDisplaySettings(): void {
    if (this.displaySettingsForm.invalid) return;
    
    // In a real app, we would save this to the backend and apply the settings
    this.showSuccessMessage('Paramètres d\'affichage mis à jour avec succès');
  }
  
  updateWithdrawalRules(): void {
    if (this.withdrawalRulesForm.invalid) return;
    
    // In a real app, we would save this to the backend
    this.showSuccessMessage('Règles de retrait mises à jour avec succès');
  }
  
  private showSuccessMessage(message: string): void {
    // In a real app, we would use a proper notification system
    alert(message);
  }
}
