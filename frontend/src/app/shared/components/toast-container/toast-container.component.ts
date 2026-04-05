import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../../../core/services/toast/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="toasts.length > 0">
      <div
        *ngFor="let toast of toasts"
        class="toast"
        [class]="'toast-' + toast.type"
        [@toastAnimation]
      >
        <div class="toast-content">
          <div class="toast-icon">
            <svg
              *ngIf="toast.type === 'success'"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
            <svg
              *ngIf="toast.type === 'error'"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <svg
              *ngIf="toast.type === 'warning'"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <svg
              *ngIf="toast.type === 'info'"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div class="toast-text">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message" *ngIf="toast.message">{{ toast.message }}</div>
          </div>
        </div>
        <button
          class="toast-close"
          (click)="dismissToast(toast.id)"
          aria-label="Close notification"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div class="toast-action" *ngIf="toast.action">
          <button class="toast-action-btn" (click)="handleAction(toast)">
            {{ toast.action.label }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
      }

      .toast {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        border-radius: var(--radius-md);
        border: 1px solid;
        box-shadow: var(--shadow-glow);
        backdrop-filter: blur(10px);
        font-family: var(--font-body);
        min-width: 300px;
      }

      .toast-success {
        background: var(--success-bg);
        border-color: rgba(76, 214, 160, 0.3);
        color: var(--success);
      }

      .toast-error {
        background: var(--error-bg);
        border-color: rgba(255, 95, 126, 0.3);
        color: var(--error);
      }

      .toast-warning {
        background: rgba(251, 191, 36, 0.1);
        border-color: rgba(251, 191, 36, 0.3);
        color: #f59e0b;
      }

      .toast-info {
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.3);
        color: #3b82f6;
      }

      .toast-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        flex: 1;
      }

      .toast-icon {
        flex-shrink: 0;
        margin-top: 2px;
      }

      .toast-text {
        flex: 1;
      }

      .toast-title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 2px;
      }

      .toast-message {
        font-size: 13px;
        opacity: 0.9;
        line-height: 1.4;
      }

      .toast-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: var(--radius-sm);
        opacity: 0.7;
        transition: opacity var(--transition);
        flex-shrink: 0;
        color: inherit;
      }

      .toast-close:hover {
        opacity: 1;
      }

      .toast-action {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .toast-action-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: inherit;
        padding: 6px 12px;
        border-radius: var(--radius-sm);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition);
      }

      .toast-action-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      @media (max-width: 480px) {
        .toast-container {
          left: 20px;
          right: 20px;
          top: 20px;
        }

        .toast {
          min-width: auto;
        }
      }
    `,
  ],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' })),
      ]),
    ]),
  ],
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription!: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription = this.toastService.toasts.subscribe((toasts) => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  dismissToast(id: string): void {
    this.toastService.dismiss(id);
  }

  handleAction(toast: Toast): void {
    if (toast.action) {
      toast.action.callback();
      this.dismissToast(toast.id);
    }
  }
}
