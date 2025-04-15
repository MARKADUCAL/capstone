import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranactionHitoryComponent } from './tranaction-hitory.component';

describe('TranactionHitoryComponent', () => {
  let component: TranactionHitoryComponent;
  let fixture: ComponentFixture<TranactionHitoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranactionHitoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TranactionHitoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
