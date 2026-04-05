import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForgetPassword } from './forget-password';

describe('ForgetPassword', () => {
  let component: ForgetPassword;
  let fixture: ComponentFixture<ForgetPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgetPassword],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgetPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty email', () => {
    expect(component.forgetPasswordForm.get('email')?.value).toBe('');
  });

  it('should validate email field as required', () => {
    const emailControl = component.forgetPasswordForm.get('email');
    emailControl?.setValue('');
    expect(emailControl?.hasError('required')).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.forgetPasswordForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();

    emailControl?.setValue('valid@email.com');
    expect(emailControl?.valid).toBeTruthy();
  });

  it('should show loading state on submit', (done) => {
    component.forgetPasswordForm.patchValue({
      email: 'test@example.com',
    });

    component.onSubmit().then(() => {
      expect(component.emailSent).toBeTruthy();
      done();
    });
  });

  it('should navigate to login on goToLogin', () => {
    spyOn(component['router'], 'navigate');
    component.goToLogin();
    expect(component['router'].navigate).toHaveBeenCalledWith(['/login']);
  });
});
