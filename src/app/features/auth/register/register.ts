import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast/toast.service';
import { AuthService } from '../../../core/services/auth/auth';
import { LoadingService } from '../../../core/services/loading/loading';
import { firstValueFrom } from 'rxjs';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RegisterUserRequest {
  email: string;
  name: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class Register implements OnInit, OnDestroy {
  // ── State ────────────────────────────────────────────────────────────────
  registerForm!: FormGroup;
  isLoading = false;
  registeredUsers: any[] = [];

  constructor(
    private fb: FormBuilder,
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
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  /**
   * Returns true when a field is invalid AND the user has interacted with it.
   */
  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control?.invalid && (control.touched || control.dirty));
  }

  getEmailError(): string {
    const control = this.registerForm.get('email');

    if (control?.hasError('required')) {
      return 'Email is required.';
    }

    if (control?.hasError('email')) {
      return 'Please enter a valid email address.';
    }

    return '';
  }

  getNameError(): string {
    const control = this.registerForm.get('name');

    if (control?.hasError('required')) {
      return 'Name is required.';
    }

    if (control?.hasError('minlength')) {
      return 'Name must be at least 2 characters long.';
    }

    return '';
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    // Mark all fields as touched to trigger validation display
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      this.toastService.error('Please fill in all required fields correctly.');
      return;
    }

    this.isLoading = true;
    this.loadingService.show();

    try {
      const { email, name } = this.registerForm.value as RegisterUserRequest;

      const response: any = await firstValueFrom(
        this.authService.registerStudentUser({ email, name }),
      );

      if (response?.status === 'success' || response?.id) {
        this.toastService.success(response?.message || 'User registered successfully!');
        this.registeredUsers.push(response.user);
        this.registerForm.reset();
      } else {
        this.toastService.error(response?.message || 'Failed to register user. Please try again.');
      }
    } catch (error: any) {
      const errorMessage =
        error?.error?.message || error?.message || 'Failed to register user. Please try again.';
      this.toastService.error(errorMessage);
      console.error('Error registering user:', error);
    } finally {
      this.isLoading = false;
      this.loadingService.hide();
    }
  }
}
