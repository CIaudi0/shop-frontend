import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  getUsers(): Observable<AdminUser[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
    return this.http.get<AdminUser[]>('http://localhost:3000/admin/users', { headers });
  }

  updateUserRole(userId: number, newRole: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
    return this.http.patch(`http://localhost:3000/admin/users/${userId}`, { role: newRole }, { headers });
  }

  deleteUser(userId: number): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
    return this.http.delete(`http://localhost:3000/admin/users/${userId}`, { headers });
  }
}