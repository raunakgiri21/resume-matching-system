import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewRegistrations } from './view-registrations';

describe('ViewRegistrations', () => {
  let component: ViewRegistrations;
  let fixture: ComponentFixture<ViewRegistrations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewRegistrations],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewRegistrations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load registrations on init', () => {
    expect(component.isLoading).toBe(true);
  });
});
