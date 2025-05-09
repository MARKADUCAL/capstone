import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageEnquiriesComponent } from './manage-enquiries.component';

describe('ManageEnquiriesComponent', () => {
  let component: ManageEnquiriesComponent;
  let fixture: ComponentFixture<ManageEnquiriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageEnquiriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageEnquiriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
