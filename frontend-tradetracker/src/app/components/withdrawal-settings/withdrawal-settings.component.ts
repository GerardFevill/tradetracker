import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WithdrawalStrategyService } from '../../services/withdrawal-strategy.service';
import { CapitalRange, WithdrawalRule, WithdrawalRuleSet } from '../../models/withdrawal-rule.model';
import { NotificationService } from '../../services/notification.service';
import { Currency } from '../../models/account.model';

@Component({
  selector: 'app-withdrawal-settings',
  templateUrl: './withdrawal-settings.component.html',
  styleUrls: ['./withdrawal-settings.component.css']
})
export class WithdrawalSettingsComponent implements OnInit {
  ruleSetsForm!: FormGroup;
  currencies: Currency[] = ['USD', 'EUR'];
  selectedCurrency: Currency = 'USD';
  
  constructor(
    private fb: FormBuilder,
    private withdrawalStrategyService: WithdrawalStrategyService,
    private notificationService: NotificationService
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    this.loadRuleSets();
  }
  
  private initForm(): void {
    this.ruleSetsForm = this.fb.group({
      capitalRanges: this.fb.array([])
    });
  }
  
  private loadRuleSets(): void {
    this.withdrawalStrategyService.getWithdrawalRuleSets().subscribe(ruleSets => {
      const ruleSet = ruleSets.find(rs => rs.currency === this.selectedCurrency);
      if (ruleSet) {
        this.resetCapitalRanges();
        ruleSet.capitalRanges.forEach(range => {
          this.addCapitalRange(range);
        });
      }
    });
  }
  
  get capitalRanges(): FormArray {
    return this.ruleSetsForm.get('capitalRanges') as FormArray;
  }
  
  addCapitalRange(range?: CapitalRange): void {
    const rangeGroup = this.fb.group({
      minAmount: [range?.minAmount || 0, [Validators.required, Validators.min(0)]],
      maxAmount: [range?.maxAmount || 0, [Validators.required, Validators.min(0)]],
      withdrawalRules: this.fb.array([])
    });
    
    // Ajouter les règles de retrait si elles existent
    if (range && range.withdrawalRules) {
      const rulesArray = rangeGroup.get('withdrawalRules') as FormArray;
      range.withdrawalRules.forEach(rule => {
        rulesArray.push(this.createRuleGroup(rule));
      });
    } else {
      // Ajouter une règle par défaut
      this.addWithdrawalRule(rangeGroup);
    }
    
    this.capitalRanges.push(rangeGroup);
  }
  
  addWithdrawalRule(rangeControl: any, rule?: WithdrawalRule): void {
    // Convertir le AbstractControl en FormGroup
    const rangeGroup = rangeControl as FormGroup;
    const rulesArray = rangeGroup.get('withdrawalRules') as FormArray;
    rulesArray.push(this.createRuleGroup(rule));
  }
  
  createRuleGroup(rule?: WithdrawalRule): FormGroup {
    return this.fb.group({
      targetPercentage: [rule?.targetPercentage || 100, [Validators.required, Validators.min(0), Validators.max(100)]],
      profitPercentageToWithdraw: [rule?.profitPercentageToWithdraw || 20, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }
  
  removeCapitalRange(index: number): void {
    this.capitalRanges.removeAt(index);
  }
  
  removeWithdrawalRule(rangeIndex: number, ruleIndex: number): void {
    const rulesArray = (this.capitalRanges.at(rangeIndex).get('withdrawalRules') as FormArray);
    rulesArray.removeAt(ruleIndex);
  }
  
  getWithdrawalRules(rangeIndex: number): FormArray {
    return this.capitalRanges.at(rangeIndex).get('withdrawalRules') as FormArray;
  }
  
  onCurrencyChange(): void {
    this.loadRuleSets();
  }
  
  resetCapitalRanges(): void {
    while (this.capitalRanges.length > 0) {
      this.capitalRanges.removeAt(0);
    }
  }
  
  saveSettings(): void {
    if (this.ruleSetsForm.invalid) {
      this.notificationService.error('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }
    
    // Récupérer tous les jeux de règles actuels
    this.withdrawalStrategyService.getWithdrawalRuleSets().subscribe(allRuleSets => {
      // Créer le jeu de règles mis à jour pour la devise sélectionnée
      const updatedRuleSet: WithdrawalRuleSet = {
        currency: this.selectedCurrency as Currency,
        capitalRanges: this.ruleSetsForm.value.capitalRanges
      };
      
      // Mettre à jour le jeu de règles pour la devise sélectionnée
      const updatedRuleSets = allRuleSets.map(rs => 
        rs.currency === this.selectedCurrency ? updatedRuleSet : rs
      );
      
      // Enregistrer les modifications
      this.withdrawalStrategyService.updateWithdrawalRuleSets(updatedRuleSets);
      this.notificationService.success('Paramètres de retrait enregistrés avec succès.');
    });
  }
}
