import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThresholdAlertsComponent } from './threshold-alerts.component';

describe('ThresholdAlertsComponent', () => {
  let component: ThresholdAlertsComponent;
  let fixture: ComponentFixture<ThresholdAlertsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ThresholdAlertsComponent]
    });
    fixture = TestBed.createComponent(ThresholdAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
