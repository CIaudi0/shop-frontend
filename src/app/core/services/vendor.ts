import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private http = inject(HttpClient);

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`/products/${id}`);
  }
  
  createProduct(productData: any): Observable<any> {
    return this.http.post(`/vendor/products`, { product: productData });
  }

  removeProduct(productId: number): Observable<any> {
    return this.http.delete(`/vendor/products/${productId}`);
  }

  updateProduct(productId: number, productData: any): Observable<any> {
    return this.http.patch(`/vendor/products/${productId}`, { product: productData });
  }
}