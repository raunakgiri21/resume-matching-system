import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Placements {
  private API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createPlacement(data: CreatePlacementRequest) {
    return this.http.post(`${this.API}/placements`, data);
  }

  getPlacements() {
    return this.http.get(`${this.API}/placements`);
  }

  getPlacementById(id: string) {
    return this.http.get(`${this.API}/placements/${id}`);
  }

  updatePlacement(id: string, data: Partial<CreatePlacementRequest>) {
    return this.http.put(`${this.API}/placements/${id}`, data);
  }

  deletePlacement(id: string) {
    return this.http.delete(`${this.API}/placements/${id}`);
  }

  registerForPosition(id: string) {
    return this.http.post(`${this.API}/placements/${id}/register`, {});
  }

  getRegistrations(id: string) {
    return this.http.get(`${this.API}/placements/${id}/registrations`);
  }

  getRegistrationResult(registrationId: string) {
    return this.http.get(`${this.API}/registrations/${registrationId}/result`);
  }

  // Matching API
  generateResumeMatchAll(id: string) {
    return this.http.post(`${this.API}/matching/placements/${id}/run`, {});
  }

  getResumeMatchResults(id: string) {
    return this.http.get(`${this.API}/matching/placements/${id}/results`);
  }

  getMyResumeMatchResult(id: string) {
    return this.http.get(`${this.API}/matching/placements/${id}/my-result`);
  }
}

export interface CreatePlacementRequest {
  company_name: string;
  role_title: string;
  job_description: string;
  ctc_lpa: number;
  location?: string;
  required_skills?: string;
  eligibility_criteria?: string;
  last_date?: Date | string;
}
