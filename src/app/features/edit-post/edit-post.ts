import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../core/services/toast/toast.service';
import { Placements, CreatePlacementRequest } from '../../core/services/placements/placements';
import { LoadingService } from '../../core/services/loading/loading';
import { AuthService } from '../../core/services/auth/auth';
import { firstValueFrom } from 'rxjs';

// ─── Component ────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-edit-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-post.html',
  styleUrls: ['./edit-post.scss'],
})
export class EditPost implements OnInit, OnDestroy {
  // ── State ────────────────────────────────────────────────────────────────
  editPostForm!: FormGroup;
  isLoading = false;
  isLoadingData = true;
  postId: string | null = null;

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private placements: Placements,
    private loadingService: LoadingService,
    private authService: AuthService,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForm();
    this.checkUserRole();
    this.loadPost();
  }

  ngOnDestroy(): void {
    // Cleanup handled by Angular
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  private buildForm(): void {
    this.editPostForm = this.fb.group({
      company_name: ['', [Validators.required, Validators.minLength(2)]],
      role_title: ['', [Validators.required, Validators.minLength(2)]],
      job_description: ['', [Validators.required, Validators.minLength(10)]],
      ctc_lpa: [0, [Validators.required, Validators.min(0)]],
      location: ['', []],
      required_skills: ['', [Validators.required]],
      eligibility_criteria: ['', []],
      status: ['open', [Validators.required]],
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

  // ── Data Loading ──────────────────────────────────────────────────────────
  private loadPost(): void {
    this.route.params.subscribe(async (params) => {
      this.postId = params['id'];

      if (!this.postId) {
        this.toastService.error('Error', 'Post not found');
        this.router.navigate(['/dashboard']);
        return;
      }

      try {
        this.isLoadingData = true;
        this.loadingService.show();
        const response: any = await firstValueFrom(this.placements.getPlacementById(this.postId));

        // Format date to YYYY-MM-DD for input[type="date"]
        if (response.last_date) {
          const date = new Date(response.last_date);
          response.last_date = date.toISOString().split('T')[0];
        }

        this.editPostForm.patchValue(response);
      } catch (error: any) {
        this.toastService.error('Error', error?.error?.message || 'Failed to load post');
        this.router.navigate(['/dashboard']);
      } finally {
        this.isLoadingData = false;
        this.loadingService.hide();
      }
    });
  }

  // ── Methods ────────────────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    if (this.editPostForm.invalid) {
      this.toastService.error('Validation Error', 'Please fill all required fields correctly.');
      return;
    }

    if (!this.postId) {
      this.toastService.error('Error', 'Post ID not found');
      return;
    }

    this.isLoading = true;
    this.loadingService.show();

    try {
      const formValue = this.editPostForm.value;

      // Convert ctc_lpa to number
      const payload: Partial<CreatePlacementRequest> = {
        ...formValue,
        ctc_lpa: Number(formValue.ctc_lpa),
      };

      // Format last_date if provided
      if (payload.last_date) {
        payload.last_date = new Date(payload.last_date).toISOString().split('T')[0];
      }

      const response = await firstValueFrom(this.placements.updatePlacement(this.postId, payload));

      this.toastService.success('Success', 'Job post updated successfully!');
      this.router.navigate(['/view-post', this.postId]);
    } catch (error: any) {
      const errorMessage = error?.error?.message || 'Failed to update job post';
      this.toastService.error('Error', errorMessage);
      console.error('Error updating job post:', error);
    } finally {
      this.isLoading = false;
      this.loadingService.hide();
    }
  }

  // ── Helper Methods ─────────────────────────────────────────────────────────
  get formControls() {
    return this.editPostForm?.controls || {};
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editPostForm?.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.editPostForm?.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return `${fieldName.replace(/_/g, ' ')} is required`;
    if (field.errors['minlength']) {
      return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
    }
    if (field.errors['min']) return `Value must be at least ${field.errors['min'].min}`;
    if (field.errors['email']) return 'Invalid email address';

    return 'Invalid field';
  }

  goBack(): void {
    if (this.postId) {
      this.router.navigate(['/view-post', this.postId]);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
