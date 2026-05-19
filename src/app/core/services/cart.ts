import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly STORAGE_KEY = 'shop_cart_data';

  private _items = signal<Product[]>([]);
  public readonly items = this._items.asReadonly();

  private loadCartRequestId = 0;

  public readonly totalCount = computed(() => this._items().length);
  public readonly totalPrice = computed(() => {
    return this._items().reduce((total, product) => total + product.price, 0);
  });

  constructor() {
    this.loadCart();
  }

  loadCart(): void {
    if (!this.auth.isLoggedIn()) {
      this._items.set(this.loadFromStorage());
      return;
    }

    const requestId = ++this.loadCartRequestId;
    this.http.get<any[]>('/cart').subscribe({
      next: (itemsResponse) => {
        if (requestId !== this.loadCartRequestId) return;
        const products: Product[] = [];
        itemsResponse.forEach(item => {
          for (let i = 0; i < item.quantity; i++) {
            products.push(item.product);
          }
        });
        this._items.set(products);
      },
      error: () => {
        if (requestId !== this.loadCartRequestId) return;
        this._items.set([]);
      }
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

    this.http.post(`/cart/add/${product.id}`, {}).subscribe({
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

    this.http.delete(`/cart/remove/${product.id}`).subscribe({
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
      this.http.post(`/cart/add/${item.id}`, {}).subscribe({
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
        const targetProduct = currentItems.find(p => p.id === productId);
        if (!targetProduct) return currentItems;

        const result: Product[] = [];
        let inserted = false;
        for (const p of currentItems) {
          if (p.id === productId) {
            if (!inserted) {
              for (let i = 0; i < quantity; i++) result.push(targetProduct);
              inserted = true;
            }
          } else {
            result.push(p);
          }
        }
        this.saveToStorage(result);
        return result;
      });
      return;
    }

    this.http.patch(`/cart/update/${productId}`, { quantity }).subscribe({
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