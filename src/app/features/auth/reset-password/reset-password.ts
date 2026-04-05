import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast/toast.service';
import { AuthService } from '../../../core/services/auth/auth';
import { LoadingService } from '../../../core/services/loading/loading';
import { firstValueFrom } from 'rxjs';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── Custom Validators ────────────────────────────────────────────────────────
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

// ─── Component ────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss'],
})
export class ResetPassword implements OnInit, OnDestroy {
  // ── State ────────────────────────────────────────────────────────────────
  resetPasswordForm!: FormGroup;
  isLoading = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isValidToken = true;
  token = '';
  passwordResetSuccess = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private toastService: ToastService,
    private authService: AuthService,
    private loadingService: LoadingService,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.extractToken();
    this.buildForm();
  }

  ngOnDestroy(): void {
    // Cleanup handled by Angular
  }

  // ── Token Extraction ──────────────────────────────────────────────────────
  private extractToken(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.token = params['token'];

      if (!this.token) {
        this.isValidToken = false;
        this.toastService.error('Invalid or missing password reset token.');
      }
    });
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  private buildForm(): void {
    this.resetPasswordForm = this.fb.group(
      {
        newPassword: [
          '',
          [Validators.required, Validators.minLength(8), this.passwordStrengthValidator.bind(this)],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator },
    );
  }

  // ── Custom Password Strength Validator ────────────────────────────────────
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const password = control.value;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;

    return !passwordValid ? { weakPassword: true } : null;
  }

  // ── Validation ────────────────────────────────────────────────────────────
  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetPasswordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getPasswordError(): string {
    const newPasswordControl = this.resetPasswordForm.get('newPassword');

    if (newPasswordControl?.hasError('required')) {
      return 'New password is required.';
    }

    if (newPasswordControl?.hasError('minlength')) {
      return 'Password must be at least 8 characters long.';
    }

    if (newPasswordControl?.hasError('weakPassword')) {
      return 'Password must include uppercase, lowercase, numbers, and special characters.';
    }

    return '';
  }

  getConfirmPasswordError(): string {
    const confirmPasswordControl = this.resetPasswordForm.get('confirmPassword');

    if (confirmPasswordControl?.hasError('required')) {
      return 'Please confirm your password.';
    }

    if (this.resetPasswordForm.hasError('passwordMismatch')) {
      return 'Passwords do not match.';
    }

    return '';
  }

  // ── Password Visibility Toggle ────────────────────────────────────────────
  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    // Mark all fields as touched to show validation errors
    Object.keys(this.resetPasswordForm.controls).forEach((key) => {
      this.resetPasswordForm.get(key)?.markAsTouched();
    });

    if (this.resetPasswordForm.invalid) {
      this.toastService.error('Please fill in all required fields correctly.');
      return;
    }

    this.isLoading = true;
    this.loadingService.show();

    try {
      const newPassword = this.resetPasswordForm.get('newPassword')?.value;

      const response: any = await firstValueFrom(
        this.authService.resetPassword(this.token, newPassword),
      );

      if (response?.status === 'success') {
        this.passwordResetSuccess = true;
        this.toastService.success(
          response?.message || 'Your password has been reset successfully!',
        );
      } else {
        this.toastService.error(response?.message || 'Failed to reset password. Please try again.');
      }
    } catch (error: any) {
      const errorMessage =
        error?.error?.message || error?.message || 'Failed to reset password. Please try again.';
      this.toastService.error(errorMessage);
      console.error('Error resetting password:', error);
    } finally {
      this.isLoading = false;
      this.loadingService.hide();
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
