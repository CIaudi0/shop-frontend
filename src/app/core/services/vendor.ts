import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  getProduct(id: string) {
    return this.http.get<any>(`http://localhost:3000/products/${id}`);
  }
  
  createProduct(productData: any) {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
    return this.http.post('http://localhost:3000/vendor/products', { product: productData }, { headers });
  }

  removeProduct(productId: number) {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
    return this.http.delete(`http://localhost:3000/vendor/products/${productId}`, { headers });
  }

  updateProduct(productId: number, productData: any) {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
    return this.http.patch(`http://localhost:3000/vendor/products/${productId}`, { product: productData }, { headers });
  }
}