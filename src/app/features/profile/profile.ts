import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth';
import { ToastService } from '../../core/services/toast/toast.service';
import { UserService } from '../../core/services/user/user';
import { LoadingService } from '../../core/services/loading/loading';
import { firstValueFrom } from 'rxjs';

interface ProfileData {
  phone: string;
  branch: string;
  graduation_year: string;
  skills: string;
  linkedin_url: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class Profile implements OnInit {
  profileForm!: FormGroup;
  isLoading = false;
  studentName = '';
  studentEmail = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService,
    private userService: UserService,
    private loadingService: LoadingService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.checkUserRole();
    this.loadProfileData();
  }

  private checkUserRole(): void {
    this.authService.user$.subscribe((user: any) => {
      if (!user || user.role !== 'student') {
        this.toastService.error('Access Denied', 'This page is only for students.');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  private buildForm(): void {
    this.profileForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      branch: ['', Validators.required],
      graduation_year: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      skills: ['', Validators.required],
      linkedin_url: ['', [Validators.pattern(/^https?:\/\/(www\.)?linkedin\.com\/.*$/)]],
    });
  }

  private async loadProfileData(): Promise<void> {
    this.loadingService.show();
    try {
      const response = await firstValueFrom(this.userService.getMe());

      this.studentName = (response as any).name || '';
      this.studentEmail = (response as any).email || '';
      this.profileForm.patchValue({
        phone: (response as any).phone || '',
        branch: (response as any).branch || '',
        graduation_year: (response as any).graduation_year || '',
        skills: (response as any).skills || '',
        linkedin_url: (response as any).linkedin_url || '',
      });
    } catch (err: unknown) {
      console.log(err);
      // Optional: show error if loading fails, but form can still be filled manually
    } finally {
      this.loadingService.hide();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.loadingService.show();

    const formData: ProfileData = this.profileForm.value;

    try {
      await firstValueFrom(this.userService.updateProfile(formData));
      this.toastService.success('Profile Updated', 'Your profile has been saved successfully.');
      this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      console.log(err);
      const message =
        (err as any)?.error?.message || 'An unexpected error occurred. Please try again.';
      this.toastService.error('Update Failed', message);
    } finally {
      this.isLoading = false;
      this.loadingService.hide();
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.profileForm.get(field);
    return !!(control?.invalid && (control.touched || control.dirty));
  }
}
