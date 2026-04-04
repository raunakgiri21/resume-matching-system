import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LoadingService } from '../../../core/services/loading/loading';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-overlay.html',
  styleUrl: './loading-overlay.scss',
})
export class LoadingOverlayComponent implements OnInit, OnDestroy {
  isLoading = false;
  private subscription!: Subscription;

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.subscription = this.loadingService.isLoading.subscribe(
      (loading) => (this.isLoading = loading),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
