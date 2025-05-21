import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WithdrawalSettingsComponent } from './withdrawal-settings.component';

describe('WithdrawalSettingsComponent', () => {
  let component: WithdrawalSettingsComponent;
  let fixture: ComponentFixture<WithdrawalSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WithdrawalSettingsComponent]
    });
    fixture = TestBed.createComponent(WithdrawalSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
