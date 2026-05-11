import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:3000/orders';

  private get headers(): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${this.auth.token()}`);
  }

  create(order: any): Observable<any> {
    return this.http.post(this.apiUrl, order, { headers: this.headers });
  }

  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.headers });
  }
  
  getOrderById(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.headers });
  }
}