import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../models/product';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:3000/cart';
  private readonly STORAGE_KEY = 'shop_cart_data';

  private itemsSubject = new BehaviorSubject<Product[]>([]);

  constructor() {
    this.loadCart();
  }

  private get headers(): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
  }

  loadCart(): void {
    if (!this.auth.token) {
      this.itemsSubject.next(this.loadFromStorage());
      return;
    }

    this.http.get<any[]>(this.apiUrl, { headers: this.headers }).subscribe({
      next: (items) => {
        const products: Product[] = [];
        items.forEach(item => {
          for (let i = 0; i < item.quantity; i++) {
            products.push(item.product);
          }
        });
        this.itemsSubject.next(products);
      },
      error: () => this.itemsSubject.next([])
    });
  }

  list(): Observable<Product[]> {
    return this.itemsSubject.asObservable();
  }

  add(product: Product): void {
    if (!this.auth.token) {
      const updated = [...this.itemsSubject.getValue(), product];
      this.itemsSubject.next(updated);
      this.saveToStorage(updated);
      return;
    }

    this.http.post(`${this.apiUrl}/add/${product.id}`, {}, { headers: this.headers }).subscribe({
      next: () => this.loadCart()
    });
  }

  remove(product: Product): void {
    if (!this.auth.token) {
      const current = this.itemsSubject.getValue();
      const index = current.findIndex(item => item.id === product.id);
      if (index !== -1) {
        const updated = [...current.slice(0, index), ...current.slice(index + 1)];
        this.itemsSubject.next(updated);
        this.saveToStorage(updated);
      }
      return;
    }

    this.http.delete(`${this.apiUrl}/remove/${product.id}`, { headers: this.headers }).subscribe({
      next: () => this.loadCart()
    });
  }

  clear(): void {
    this.itemsSubject.next([]);
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  syncLocalCartToServer(): void {
    const localItems = this.loadFromStorage();
    if (localItems.length === 0 || !this.auth.token) {
      this.loadCart();
      return;
    }

    let completedRequests = 0;
    localItems.forEach((item) => {
      this.http.post(`${this.apiUrl}/add/${item.id}`, {}, { headers: this.headers }).subscribe({
        next: () => {
          completedRequests++;
          if (completedRequests === localItems.length) {
            sessionStorage.removeItem(this.STORAGE_KEY);
            this.loadCart();
          }
        }
      });
    });
  }

  updateQuantity(productId: number, quantity: number): void {
    if (!this.auth.token) {
      return; 
    }

    this.http.patch(`${this.apiUrl}/update/${productId}`, { quantity: quantity }, { headers: this.headers }).subscribe({
      next: () => this.loadCart()
    });
  }

  private loadFromStorage(): Product[] {
    const saved = sessionStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  }

  private saveToStorage(items: Product[]): void {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }
}