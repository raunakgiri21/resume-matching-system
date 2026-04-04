import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { accessGuard } from './core/guards/access.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'dashboard',
    canActivate: [accessGuard()],
    loadComponent: () => import('./features/dashbaord/dashbaord').then((m) => m.Dashbaord),
  },
  {
    path: 'profile',
    canActivate: [accessGuard('student')],
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
  },
  {
    path: 'resume',
    canActivate: [accessGuard('student')],
    loadComponent: () => import('./features/resume/resume').then((m) => m.Resume),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
