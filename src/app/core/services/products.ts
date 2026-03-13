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

  private apiUrl = 'http://localhost:3000/products';

  getProducts(query?: string): Observable<Product[]> {
    let params = new HttpParams();
    
    if (query) {
      params = params.set('q', query);
    }

    return this.http.get<Product[]>(this.apiUrl, { params });
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  removeById(id: number): Observable<void> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
    return this.http.delete<void>(`http://localhost:3000/vendor/products/${id}`, { headers });
  }
}
