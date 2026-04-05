import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  public toasts = this.toasts$.asObservable();
  private timeoutHandles: Record<string, number> = {};

  show(toast: Omit<Toast, 'id'>): void {
    const id = Date.now().toString();
    const duration = toast.duration ?? 5000;

    const newToast: Toast = {
      id,
      duration,
      ...toast,
    };

    this.toasts$.next([...this.toasts$.value, newToast]);

    // Auto dismiss after duration if positive
    if (duration > 0) {
      this.timeoutHandles[id] = window.setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  success(title: string, message?: string, duration?: number): void {
    this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message?: string, duration?: number): void {
    this.show({ type: 'error', title, message, duration });
  }

  info(title: string, message?: string, duration?: number): void {
    this.show({ type: 'info', title, message, duration });
  }

  warning(title: string, message?: string, duration?: number): void {
    this.show({ type: 'warning', title, message, duration });
  }

  dismiss(id: string): void {
    if (this.timeoutHandles[id]) {
      clearTimeout(this.timeoutHandles[id]);
      delete this.timeoutHandles[id];
    }
    this.toasts$.next(this.toasts$.value.filter((toast) => toast.id !== id));
  }

  dismissAll(): void {
    Object.values(this.timeoutHandles).forEach((handle) => clearTimeout(handle));
    this.timeoutHandles = {};
    this.toasts$.next([]);
  }
}
