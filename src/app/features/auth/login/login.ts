import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast/toast.service';
import { AuthService } from '../../../core/services/auth/auth';
import { firstValueFrom } from 'rxjs';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements OnInit, OnDestroy {
  // ── State ────────────────────────────────────────────────────────────────
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForm();
    this.restoreEmail();
  }

  ngOnDestroy(): void {
    // Cleanup handled by Angular
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  private buildForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false],
    });
  }

  /**
   * Pre-fill email if previously remembered.
   */
  private restoreEmail(): void {
    const saved = localStorage.getItem('resume_matcher_email');
    if (saved) {
      this.loginForm.patchValue({ email: saved, rememberMe: true });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  /**
   * Returns true when a field is invalid AND the user has interacted with it.
   */
  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control?.invalid && (control.touched || control.dirty));
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    // Mark all fields as touched to trigger validation display
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) return;

    this.isLoading = true;

    const { email, password, rememberMe } = this.loginForm.value as LoginCredentials;

    try {
      const response = await firstValueFrom(this.authService.login({ email, password }));
      console.log('Login response:', response);
      if (response) {
        console.log('Login response:', response);
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('token', (response as any).token);
        storage.setItem('user', JSON.stringify((response as any).user));
        this.authService.setUser((response as any).user);
        this.toastService.success('Login Successful', 'Welcome to Resume Matcher!');
        this.router.navigate(['/dashboard']);
      }
      // ── Remember email preference ──
      if (rememberMe) {
        localStorage.setItem('resume_matcher_email', email);
      } else {
        localStorage.removeItem('resume_matcher_email');
      }
    } catch (err: unknown) {
      console.log(err);
      const message =
        (err as any)?.error.message || 'An unexpected error occurred. Please try again.';
      this.toastService.error('Login Failed', message);
    } finally {
      this.isLoading = false;
    }
  }

  // ── Mock (remove in production) ───────────────────────────────────────────
  /**
   * Simulates a network request for demo/development purposes.
   * Replace with your actual AuthService.login() call.
   */
  private mockLoginRequest(email: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'demo@nexus.io' && password === 'password123') {
          resolve();
        } else {
          reject(new Error('Invalid email or password. Please try again.'));
        }
      }, 1800);
    });
  }
}
