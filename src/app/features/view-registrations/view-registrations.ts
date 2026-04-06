import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast/toast.service';
import { LoadingService } from '../../core/services/loading/loading';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Placements } from '../../core/services/placements/placements';

// ─── Component ────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-view-registrations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-registrations.html',
  styleUrls: ['./view-registrations.scss'],
})
export class ViewRegistrations implements OnInit, OnDestroy {
  // ── State ────────────────────────────────────────────────────────────────
  postId: string | null = null;
  postTitle: string = '';
  registrations: any[] = [];
  isLoading = true;
  currentPage = 1;
  itemsPerPage = 10;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private placements: Placements,
    private toastService: ToastService,
    private loadingService: LoadingService,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadRegistrations();
  }

  ngOnDestroy(): void {
    // Cleanup handled by Angular
  }

  // ── Data Loading ──────────────────────────────────────────────────────────
  private loadRegistrations(): void {
    this.route.queryParams.subscribe(async (params) => {
      this.postId = params['id'];
      this.postTitle = params['title'] || 'Position';

      if (!this.postId) {
        this.toastService.error('Error', 'Post ID not found');
        this.goBack();
        return;
      }

      try {
        this.isLoading = true;
        this.loadingService.show();
        const response: any = await firstValueFrom(this.placements.getRegistrations(this.postId));
        this.registrations = response || [];

      } catch (error: any) {
        this.toastService.error('Error', error?.error?.message || 'Failed to load registrations');
        this.goBack();
      } finally {
        this.isLoading = false;
        this.loadingService.hide();
      }
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  get totalPages(): number {
    return Math.ceil(this.registrations.length / this.itemsPerPage);
  }

  get paginatedRegistrations(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.registrations.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  goBack(): void {
    window.history.back();
  }
}
