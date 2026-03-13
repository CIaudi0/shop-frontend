import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:3000/orders';

  create(order: any): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
    
    return this.http.post(this.apiUrl, order, { headers });
  }

  getOrders(): Observable<any[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
    return this.http.get<any[]>(this.apiUrl, { headers });
  }
  
  getOrderById(id: string | number): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers });
  }
}