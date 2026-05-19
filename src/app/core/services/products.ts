import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);

  getProducts(query?: string): Observable<Product[]> {
    const params = query ? new HttpParams().set('q', query) : undefined;
    return this.http.get<Product[]>('/products', { params });
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`/products/${id}`);
  }
}