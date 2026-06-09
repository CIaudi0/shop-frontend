import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product';

export interface ProductsMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ProductsResponse {
  products: Product[];
  meta: ProductsMeta;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getProducts(query?: string, page: number = 1, perPage: number = 8): Observable<ProductsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());
    if (query) params = params.set('q', query);
    return this.http.get<ProductsResponse>('/products', { params });
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`/products/${id}`);
  }
}
