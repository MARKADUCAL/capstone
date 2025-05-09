import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WashServicesComponent } from './wash-services.component';

describe('WashServicesComponent', () => {
  let component: WashServicesComponent;
  let fixture: ComponentFixture<WashServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WashServicesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WashServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
