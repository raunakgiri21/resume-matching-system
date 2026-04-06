import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast/toast.service';
import { Placements, CreatePlacementRequest } from '../../core/services/placements/placements';
import { LoadingService } from '../../core/services/loading/loading';
import { AuthService } from '../../core/services/auth/auth';
import { firstValueFrom } from 'rxjs';

// ─── Component ────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-view-post',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-post.html',
  styleUrls: ['./view-post.scss'],
})
export class ViewPost implements OnInit, OnDestroy {
  // ── State ────────────────────────────────────────────────────────────────
  post: (CreatePlacementRequest & { id?: string; status?: string }) | null = null;
  isLoading = true;
  isSubmitting = false;
  userRole: string | null = null;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private toastService: ToastService,
    private placements: Placements,
    private loadingService: LoadingService,
    private authService: AuthService,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadPost();
    this.getUserRole();
  }

  ngOnDestroy(): void {
    // Cleanup handled by Angular
  }

  // ── Data Loading ──────────────────────────────────────────────────────────
  private loadPost(): void {
    this.route.params.subscribe(async (params) => {
      if (!params['id']) {
        this.toastService.error('Error', 'Post not found');
        this.router.navigate(['/dashboard']);
        return;
      }

      try {
        this.isLoading = true;
        this.loadingService.show();
        const response = await firstValueFrom(this.placements.getPlacementById(params['id']));
        this.post = response as CreatePlacementRequest & { id?: string; status?: string };
      } catch (error: any) {
        this.toastService.error('Error', error?.error?.message || 'Failed to load post');
        this.router.navigate(['/dashboard']);
      } finally {
        this.isLoading = false;
        this.loadingService.hide();
      }
    });
  }

  private getUserRole(): void {
    this.authService.user$.subscribe((user) => {
      if (user?.role) {
        this.userRole = user.role;
      }
    });
  }

  // ── Action Methods ────────────────────────────────────────────────────────
  async generateResumeMatch(): Promise<void> {
    if (!this.post?.id) return;

    try {
      this.isSubmitting = true;
      this.isLoading = true;
      this.loadingService.show();
      // Call API to generate resume match
      const response = (await firstValueFrom(
        this.placements.generateResumeMatchAll(this.post.id),
      )) as any;
      this.toastService.success(
        'Success',
        response?.message || 'Resume match generated successfully!',
      );
      // Optionally navigate to a results page or display the match details
    } catch (error: any) {
      this.toastService.error('Error', error?.error?.message || 'Failed to generate resume match');
    } finally {
      this.isSubmitting = false;
      this.isLoading = false;
      this.loadingService.hide();
    }
  }

  async registerForPost(): Promise<void> {
    if (!this.post?.id) return;

    try {
      this.isSubmitting = true;
      this.isLoading = true;
      this.loadingService.show();
      // Call API to register student for this post
      await firstValueFrom(this.placements.registerForPosition(this.post.id));
      this.toastService.success('Success', 'Successfully registered for this post!');
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.toastService.error('Error', error?.error?.message || 'Failed to register');
    } finally {
      this.isSubmitting = false;
      this.isLoading = false;
      this.loadingService.hide();
    }
  }

  goToUpdatePost(): void {
    if (this.post?.id) {
      this.router.navigate(['/update-post', this.post.id]);
    }
  }

  viewRegistrations(): void {
    if (this.post?.id && this.post?.role_title) {
      this.router.navigate(['/view-registrations'], {
        queryParams: {
          id: this.post.id,
          title: this.post.role_title,
        },
      });
    }
  }

  viewResults(): void {
    if (this.post?.id && this.post?.role_title) {
      this.router.navigate(['/view-results'], {
        queryParams: {
          id: this.post.id,
          title: this.post.role_title,
        },
      });
    }
  }

  getFeedback(): void {
    if (this.post?.id) {
      this.router.navigate(['/get-feedback', this.post.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  // ── Checks ────────────────────────────────────────────────────────────────
  isStudent(): boolean {
    return this.userRole === 'student';
  }

  isAdmin(): boolean {
    return this.userRole === 'admin';
  }

  isPostOpen(): boolean {
    return this.post?.status === 'open';
  }

  shouldShowRegister(): boolean {
    return this.isStudent() && this.isPostOpen();
  }

  shouldShowUpdate(): boolean {
    return this.isAdmin();
  }
}
