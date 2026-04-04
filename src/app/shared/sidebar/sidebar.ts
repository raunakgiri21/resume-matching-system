// shared/sidebar/sidebar.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class SidebarComponent {
  user$: Observable<any>;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    this.user$ = this.auth.user$;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
