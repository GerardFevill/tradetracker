import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceHistoryComponent } from './balance-history.component';

describe('BalanceHistoryComponent', () => {
  let component: BalanceHistoryComponent;
  let fixture: ComponentFixture<BalanceHistoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BalanceHistoryComponent]
    });
    fixture = TestBed.createComponent(BalanceHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
