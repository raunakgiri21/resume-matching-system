import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // 🔹 GET /users/me
  getMe() {
    return this.http.get(`${this.API}/users/me`).pipe(
      catchError((err) => {
        console.error('getMe failed:', err);
        return throwError(() => this.formatError(err));
      }),
    );
  }

  // 🔹 PUT /users/me
  updateProfile(data: { name?: string; email?: string; password?: string; [key: string]: any }) {
    return this.http.put(`${this.API}/users/me`, data).pipe(
      catchError((err) => {
        console.error('updateProfile failed:', err);
        return throwError(() => this.formatError(err));
      }),
    );
  }

  // 🔹 POST /users/me/resume
  uploadResume(file: File) {
    const formData = new FormData();
    formData.append('resume', file);

    return this.http.post(`${this.API}/users/me/resume`, formData).pipe(
      catchError((err) => {
        console.error('uploadResume failed:', err);
        return throwError(() => this.formatError(err));
      }),
    );
  }

  // 🔹 Centralized error formatter
  private formatError(err: any) {
    if (err?.error?.message) {
      return err.error.message;
    }

    if (err?.status === 0) {
      return 'Network error. Please check your connection.';
    }

    if (err?.status === 401) {
      return 'Unauthorized. Please login again.';
    }

    if (err?.status === 413) {
      return 'File too large. Max size is 5MB.';
    }

    return 'Something went wrong. Try again.';
  }
}
