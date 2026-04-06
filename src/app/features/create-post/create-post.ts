import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast/toast.service';
import { Placements, CreatePlacementRequest } from '../../core/services/placements/placements';
import { LoadingService } from '../../core/services/loading/loading';
import { AuthService } from '../../core/services/auth/auth';
import { firstValueFrom } from 'rxjs';

// ─── Component ────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-post.html',
  styleUrls: ['./create-post.scss'],
})
export class CreatePost implements OnInit, OnDestroy {
  // ── State ────────────────────────────────────────────────────────────────
  createPostForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private toastService: ToastService,
    private placements: Placements,
    private loadingService: LoadingService,
    private authService: AuthService,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForm();
    this.checkUserRole();
  }

  ngOnDestroy(): void {
    // Cleanup handled by Angular
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  private buildForm(): void {
    this.createPostForm = this.fb.group({
      company_name: ['', [Validators.required, Validators.minLength(2)]],
      role_title: ['', [Validators.required, Validators.minLength(2)]],
      job_description: ['', [Validators.required, Validators.minLength(10)]],
      ctc_lpa: [0, [Validators.required, Validators.min(0)]],
      location: ['', []],
      required_skills: ['', [Validators.required]],
      eligibility_criteria: ['', []],
      last_date: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
    });
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  private checkUserRole(): void {
    this.authService.user$.subscribe((user: any) => {
      if (!user || user.role !== 'admin') {
        this.toastService.error('Access Denied', 'This page is only for admins.');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  // ── Methods ────────────────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    if (this.createPostForm.invalid) {
      this.toastService.error('Validation Error', 'Please fill all required fields correctly.');
      return;
    }

    this.isLoading = true;
    this.loadingService.show();

    try {
      const formValue = this.createPostForm.value;

      // Convert ctc_lpa to number
      const payload: CreatePlacementRequest = {
        ...formValue,
        ctc_lpa: Number(formValue.ctc_lpa),
      };

      // Format last_date if provided
      if (payload.last_date) {
        payload.last_date = new Date(payload.last_date).toISOString().split('T')[0];
      }

      const response = await firstValueFrom(this.placements.createPlacement(payload));

      this.toastService.success('Success', 'Job post created successfully!');
      this.createPostForm.reset();
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      const errorMessage = error?.error?.message || 'Failed to create job post';
      this.toastService.error('Error', errorMessage);
      console.error('Error creating job post:', error);
    } finally {
      this.isLoading = false;
      this.loadingService.hide();
    }
  }

  // ── Helper Methods ─────────────────────────────────────────────────────────
  get formControls() {
    return this.createPostForm?.controls || {};
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.createPostForm?.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.createPostForm?.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return `${fieldName.replace(/_/g, ' ')} is required`;
    if (field.errors['minlength']) {
      return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
    }
    if (field.errors['min']) return `Value must be at least ${field.errors['min'].min}`;
    if (field.errors['email']) return 'Invalid email address';

    return 'Invalid field';
  }
}
