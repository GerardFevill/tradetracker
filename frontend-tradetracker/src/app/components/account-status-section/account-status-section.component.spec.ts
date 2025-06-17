import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountStatusSectionComponent } from './account-status-section.component';

describe('AccountStatusSectionComponent', () => {
  let component: AccountStatusSectionComponent;
  let fixture: ComponentFixture<AccountStatusSectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccountStatusSectionComponent]
    });
    fixture = TestBed.createComponent(AccountStatusSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
