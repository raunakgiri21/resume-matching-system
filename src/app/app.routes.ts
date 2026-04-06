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
    path: 'forget-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forget-password/forget-password').then((m) => m.ForgetPassword),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'register',
    canActivate: [accessGuard('admin')],
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'create-post',
    canActivate: [accessGuard('admin')],
    loadComponent: () => import('./features/create-post/create-post').then((m) => m.CreatePost),
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
    path: 'view-post/:id',
    canActivate: [accessGuard()],
    loadComponent: () => import('./features/view-post/view-post').then((m) => m.ViewPost),
  },
  {
    path: 'update-post/:id',
    canActivate: [accessGuard('admin')],
    loadComponent: () => import('./features/edit-post/edit-post').then((m) => m.EditPost),
  },
  {
    path: 'view-registrations',
    canActivate: [accessGuard('admin')],
    loadComponent: () =>
      import('./features/view-registrations/view-registrations').then((m) => m.ViewRegistrations),
  },
  {
    path: 'view-results',
    canActivate: [accessGuard('admin')],
    loadComponent: () => import('./features/view-results/view-results').then((m) => m.ViewResults),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
