import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast/toast.service';
import { LoadingService } from '../../core/services/loading/loading';
import { firstValueFrom } from 'rxjs';
import { Placements } from '../../core/services/placements/placements';

// ─── Component ────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-get-feedback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './get-feedback.html',
  styleUrls: ['./get-feedback.scss'],
})
export class GetFeedback implements OnInit, OnDestroy {
  // ── State ────────────────────────────────────────────────────────────────
  placementId: string | null = null;
  feedback: any = null;
  placement: any = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private placements: Placements,
    private toastService: ToastService,
    private loadingService: LoadingService,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadFeedback();
  }

  ngOnDestroy(): void {
    // Cleanup handled by Angular
  }

  // ── Data Loading ──────────────────────────────────────────────────────────
  private loadFeedback(): void {
    this.route.params.subscribe(async (params) => {
      this.placementId = params['id'];

      if (!this.placementId) {
        this.toastService.error('Error', 'Placement ID not found');
        this.goBack();
        return;
      }

      try {
        this.isLoading = true;
        this.loadingService.show();
        // Fetch both placement details and feedback in parallel
        const [placement, feedback] = await Promise.all([
          firstValueFrom(this.placements.getPlacementById(this.placementId)),
          firstValueFrom(this.placements.getMyResumeMatchResult(this.placementId)),
        ]);
        this.placement = placement;
        this.feedback = feedback;
      } catch (error: any) {
        this.toastService.error('Error', error?.error?.message || 'Failed to load feedback');
        this.goBack();
      } finally {
        this.isLoading = false;
        this.loadingService.hide();
      }
    });
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  goBack(): void {
    window.history.back();
  }
}
