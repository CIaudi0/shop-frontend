import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>('/admin/users');
  }

  updateUserRole(userId: number, newRole: string): Observable<any> {
    return this.http.patch(`/admin/users/${userId}`, { role: newRole });
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`/admin/users/${userId}`);
  }
}