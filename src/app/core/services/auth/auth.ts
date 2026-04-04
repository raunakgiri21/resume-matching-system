import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private API = environment.apiUrl;

  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(data: { email: string; password: string }) {
    return this.http.post(`${this.API}/auth/login`, data);
  }

  initUser() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    const isPersistent = !!localStorage.getItem('token');

    const stored = isPersistent ? localStorage.getItem('user') : sessionStorage.getItem('user');

    if (stored) {
      this.userSubject.next(JSON.parse(stored));
    }

    this.http.get(`${this.API}/users/me`).subscribe({
      next: (user: any) => {
        this.userSubject.next(user);

        if (isPersistent) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          sessionStorage.setItem('user', JSON.stringify(user));
        }
      },
      error: (err) => {
        if (err.status === 401) {
          this.logout();
        } else {
          console.warn('Keeping cached user due to network issue');
        }
      },
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.userSubject.next(null); // 🔥 update UI
  }

  setUser(user: any) {
    this.userSubject.next(user);
  }

  isLoggedIn() {
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  }
}
