import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { Product } from '../models/product';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:3000';

  private get headers(): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${this.auth.token()}`);
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }
  
  createProduct(productData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/vendor/products`, { product: productData }, { headers: this.headers });
  }

  removeProduct(productId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/vendor/products/${productId}`, { headers: this.headers });
  }

  updateProduct(productId: number, productData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/vendor/products/${productId}`, { product: productData }, { headers: this.headers });
  }
}