import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Product } from '../models/product';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:3000/cart';
  private readonly STORAGE_KEY = 'shop_cart_data';

  private _items = signal<Product[]>([]);
  public readonly items = this._items.asReadonly();

  public readonly totalCount = computed(() => this._items().length);
  public readonly totalPrice = computed(() => {
    return this._items().reduce((total, product) => total + product.price, 0);
  });

  constructor() {
    this.loadCart();
  }

  private get headers(): HttpHeaders {
    const token = this.auth.token();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  loadCart(): void {
    if (!this.auth.isLoggedIn()) {
      this._items.set(this.loadFromStorage());
      return;
    }

    this.http.get<any[]>(this.apiUrl, { headers: this.headers }).subscribe({
      next: (itemsResponse) => {
        const products: Product[] = [];
        itemsResponse.forEach(item => {
          for (let i = 0; i < item.quantity; i++) {
            products.push(item.product);
          }
        });
        this._items.set(products);
      },
      error: () => this._items.set([])
    });
  }

  add(product: Product): void {
    if (!this.auth.isLoggedIn()) {
      this._items.update(currentItems => {
        const updated = [...currentItems, product];
        this.saveToStorage(updated);
        return updated;
      });
      return;
    }

    this.http.post(`${this.apiUrl}/add/${product.id}`, {}, { headers: this.headers }).subscribe({
      next: () => this.loadCart()
    });
  }

  remove(product: Product): void {
    if (!this.auth.isLoggedIn()) {
      this._items.update(currentItems => {
        const index = currentItems.findIndex(p => p.id === product.id);
        if (index > -1) {
          const updated = [...currentItems];
          updated.splice(index, 1);
          this.saveToStorage(updated);
          return updated;
        }
        return currentItems;
      });
      return;
    }

    this.http.delete(`${this.apiUrl}/remove/${product.id}`, { headers: this.headers }).subscribe({
      next: () => this.loadCart()
    });
  }

  clear(): void {
    this._items.set([]);
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  syncLocalCartToServer(): void {
    const localItems = this.loadFromStorage();
    if (localItems.length === 0 || !this.auth.isLoggedIn()) {
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
    if (!this.auth.isLoggedIn()) {
      this._items.update(currentItems => {
        const filtered = currentItems.filter(p => p.id !== productId);
        const targetProduct = currentItems.find(p => p.id === productId);
        
        if (targetProduct) {
          for (let i = 0; i < quantity; i++) {
            filtered.push(targetProduct);
          }
        }
        this.saveToStorage(filtered);
        return filtered;
      });
      return;
    }

    this.http.patch(`${this.apiUrl}/update/${productId}`, { quantity }, { headers: this.headers }).subscribe({
      next: () => this.loadCart()
    });
  }

  private loadFromStorage(): Product[] {
    const data = sessionStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(items: Product[]): void {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }
}