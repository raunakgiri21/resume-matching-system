import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent, LoadingOverlayComponent } from './shared/components';
import { SidebarComponent } from './shared/sidebar/sidebar';
import { AuthService } from './core/services/auth/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, SidebarComponent, LoadingOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor(private auth: AuthService) {
    this.auth.initUser();
  }

  get user$() {
    return this.auth.user$;
  }
}
