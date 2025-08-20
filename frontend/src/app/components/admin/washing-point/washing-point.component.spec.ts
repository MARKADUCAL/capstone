import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WashingPointComponent } from './washing-point.component';

describe('WashingPointComponent', () => {
  let component: WashingPointComponent;
  let fixture: ComponentFixture<WashingPointComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WashingPointComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WashingPointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
