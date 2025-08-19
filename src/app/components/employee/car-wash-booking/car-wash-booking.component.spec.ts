import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarWashBookingComponent } from './car-wash-booking.component';

describe('CarWashBookingComponent', () => {
  let component: CarWashBookingComponent;
  let fixture: ComponentFixture<CarWashBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarWashBookingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CarWashBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

