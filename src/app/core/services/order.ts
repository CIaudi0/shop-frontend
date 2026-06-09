import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);

  create(order: any): Observable<any> {
    return this.http.post('/orders', order);
  }

  getOrders(): Observable<any[]> {
    return this.http.get<any[]>('/orders');
  }

  getOrderById(id: string | number): Observable<any> {
    return this.http.get<any>(`/orders/${id}`);
  }
}