import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth';
import { UserService } from '../../core/services/user/user';
import { ToastService } from '../../core/services/toast/toast.service';
import { LoadingService } from '../../core/services/loading/loading';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-resume',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resume.html',
  styleUrl: './resume.scss',
})
export class Resume implements OnInit {
  resumeUrl: string | null = null;
  safeResumeUrl: SafeResourceUrl | null = null;
  isUploading = false;
  activeTab: 'upload' | 'view' = 'upload';

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private toastService: ToastService,
    private loadingService: LoadingService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadUserResume();
  }

  private checkUserRole(): void {
    this.authService.user$.subscribe((user: any) => {
      if (!user || user.role !== 'student') {
        this.toastService.error('Access Denied', 'This page is only for students.');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  private async loadUserResume(): Promise<void> {
    this.loadingService.show();
    try {
      const response = await firstValueFrom(this.userService.getMe());
      this.resumeUrl = (response as any).resume_url || null;
      this.safeResumeUrl = this.resumeUrl
        ? this.sanitizer.bypassSecurityTrustResourceUrl(`${this.resumeUrl}#toolbar=0&navpanes=0&scrollbar=1`)
        : null;
      console.log('Resume URL loaded:', this.resumeUrl);
    } catch (err: unknown) {
      console.log('Failed to load resume:', err);
    } finally {
      this.loadingService.hide();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.uploadResume(file);
    }
  }

  private async uploadResume(file: File): Promise<void> {
    // Validate file type
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      this.toastService.error('Invalid File', 'Please upload a PDF file.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      this.toastService.error('File Too Large', 'Please upload a file smaller than 5MB.');
      return;
    }

    this.isUploading = true;
    this.loadingService.show();

    try {
      const response = await firstValueFrom(this.userService.uploadResume(file));
      this.toastService.success('Resume Uploaded', 'Your resume has been uploaded successfully.');

      // Reload user data to get the new resume URL
      await this.loadUserResume();
    } catch (err: unknown) {
      console.log('Upload failed:', err);
      const message = (err as any)?.error?.message || 'Failed to upload resume. Please try again.';
      this.toastService.error('Upload Failed', message);
    } finally {
      this.isUploading = false;
      this.loadingService.hide();
    }
  }

  viewResume(): void {
    if (this.resumeUrl) {
      window.open(this.resumeUrl, '_blank');
    }
  }

  setActiveTab(tab: 'upload' | 'view'): void {
    this.activeTab = tab;
  }
}
