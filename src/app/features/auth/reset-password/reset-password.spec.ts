import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResetPassword } from './reset-password';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('ResetPassword', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ token: 'test-token-123' }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract token from query params', (done) => {
    setTimeout(() => {
      expect(component.token).toBe('test-token-123');
      expect(component.isValidToken).toBeTruthy();
      done();
    }, 100);
  });

  it('should initialize the form with empty passwords', () => {
    expect(component.resetPasswordForm.get('newPassword')?.value).toBe('');
    expect(component.resetPasswordForm.get('confirmPassword')?.value).toBe('');
  });

  it('should validate password strength', () => {
    const passwordControl = component.resetPasswordForm.get('newPassword');

    // Too short
    passwordControl?.setValue('Pass1!');
    expect(passwordControl?.hasError('minlength')).toBeTruthy();

    // Missing uppercase
    passwordControl?.setValue('password123!');
    expect(passwordControl?.hasError('weakPassword')).toBeTruthy();

    // Missing lowercase
    passwordControl?.setValue('PASSWORD123!');
    expect(passwordControl?.hasError('weakPassword')).toBeTruthy();

    // Missing numbers
    passwordControl?.setValue('Password!');
    expect(passwordControl?.hasError('weakPassword')).toBeTruthy();

    // Missing special characters
    passwordControl?.setValue('Password123');
    expect(passwordControl?.hasError('weakPassword')).toBeTruthy();

    // Valid password
    passwordControl?.setValue('Password123!');
    expect(passwordControl?.valid).toBeTruthy();
  });

  it('should validate password match', () => {
    component.resetPasswordForm.patchValue({
      newPassword: 'Password123!',
      confirmPassword: 'DifferentPass123!',
    });

    expect(component.resetPasswordForm.hasError('passwordMismatch')).toBeTruthy();

    component.resetPasswordForm.patchValue({
      confirmPassword: 'Password123!',
    });

    expect(component.resetPasswordForm.hasError('passwordMismatch')).toBeFalsy();
  });

  it('should toggle password visibility', () => {
    expect(component.showNewPassword).toBeFalsy();
    component.toggleNewPasswordVisibility();
    expect(component.showNewPassword).toBeTruthy();
    component.toggleNewPasswordVisibility();
    expect(component.showNewPassword).toBeFalsy();
  });

  it('should navigate to login on goToLogin', () => {
    spyOn(component['router'], 'navigate');
    component.goToLogin();
    expect(component['router'].navigate).toHaveBeenCalledWith(['/login']);
  });
});
