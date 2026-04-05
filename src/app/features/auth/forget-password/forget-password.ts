import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast/toast.service';
import { AuthService } from '../../../core/services/auth/auth';
import { firstValueFrom } from 'rxjs';
import { LoadingService } from '../../../core/services/loading/loading';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ForgetPasswordRequest {
  email: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forget-password.html',
  styleUrls: ['./forget-password.scss'],
})
export class ForgetPassword implements OnInit, OnDestroy {
  // ── State ────────────────────────────────────────────────────────────────
  forgetPasswordForm!: FormGroup;
  isLoading = false;
  emailSent = false;
  submittedEmail = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService,
    private loadingService: LoadingService,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForm();
  }

  ngOnDestroy(): void {
    // Cleanup handled by Angular
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  private buildForm(): void {
    this.forgetPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  // ── Validation ────────────────────────────────────────────────────────────
  isFieldInvalid(fieldName: string): boolean {
    const field = this.forgetPasswordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    // Mark all fields as touched to show validation errors
    Object.keys(this.forgetPasswordForm.controls).forEach((key) => {
      this.forgetPasswordForm.get(key)?.markAsTouched();
    });

    if (this.forgetPasswordForm.invalid) {
      this.toastService.error('Please fill in all required fields correctly.');
      return;
    }

    this.isLoading = true;
    this.loadingService.show();

    try {
      const request: ForgetPasswordRequest = this.forgetPasswordForm.value;
      this.submittedEmail = request.email;

      const response: any = await firstValueFrom(this.authService.forgotPassword(request.email));

      if (response?.status === 'success') {
        this.emailSent = true;
        this.toastService.success(
          response?.message || 'Password reset link sent! Check your email for instructions.',
        );
      } else {
        this.toastService.error(
          response?.message || 'Failed to send password reset email. Please try again.',
        );
      }
    } catch (error: any) {
      const errorMessage =
        error?.error?.message ||
        error?.message ||
        'Failed to send password reset email. Please try again.';
      this.toastService.error(errorMessage);
      console.error('Error sending password reset email:', error);
    } finally {
      this.isLoading = false;
      this.loadingService.hide();
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  goBack(): void {
    this.emailSent = false;
    this.forgetPasswordForm.reset();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
