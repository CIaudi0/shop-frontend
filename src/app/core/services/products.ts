import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private apiUrl = 'http://localhost:3000';

  getProducts(query?: string): Observable<Product[]> {
    const params = query ? new HttpParams().set('q', query) : undefined;
    return this.http.get<Product[]>(`${this.apiUrl}/products`, { params });
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  removeById(id: number): Observable<void> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.auth.token()}`);
    return this.http.delete<void>(`${this.apiUrl}/vendor/products/${id}`, { headers });
  }
}