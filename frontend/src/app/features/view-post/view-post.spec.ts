import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewPost } from './view-post';

describe('ViewPost', () => {
  let component: ViewPost;
  let fixture: ComponentFixture<ViewPost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewPost],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewPost);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show register button for students when post is open', () => {
    component.post = { company_name: 'Test', status: 'open' };
    component.userRole = 'student';
    expect(component.shouldShowRegister()).toBe(true);
  });

  it('should show update button for admin when post is open', () => {
    component.post = { company_name: 'Test', status: 'open' };
    component.userRole = 'admin';
    expect(component.shouldShowUpdate()).toBe(true);
  });

  it('should not show buttons when post is closed', () => {
    component.post = { company_name: 'Test', status: 'closed' };
    component.userRole = 'student';
    expect(component.shouldShowRegister()).toBe(false);
  });
});
