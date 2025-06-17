import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    // Les fonctionnalités ont été déplacées vers des composants dédiés:
    // - SummarySectionComponent
    // - AccountStatusSectionComponent
    // - QuickActionsComponent
    // - ThresholdAlertsComponent (déjà existant)
    
    console.log('Dashboard initialisé avec composants modulaires');
  }
}
