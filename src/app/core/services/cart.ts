import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product';
import { AuthService } from './auth';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {

  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly STORAGE_KEY = 'shop_cart_data';

  private _items = signal<CartItem[]>([]);
  public readonly items = this._items.asReadonly();

  private loadCartRequestId = 0;
  private snackBar = inject(MatSnackBar);

  public readonly totalCount = computed(() =>
    this._items().reduce((total, item) => total + item.quantity, 0)
  );

  public readonly totalPrice = computed(() =>
    this._items().reduce((total, item) => total + (item.product.price * item.quantity), 0)
  );

  constructor() {
    this.loadCart();
  }

  loadCart(): void {
    if (!this.auth.isLoggedIn()) {
      this._items.set(this.loadFromStorage());
      return;
    }

    const requestId = ++this.loadCartRequestId;
    this.http.get<CartItem[]>('/cart').subscribe({
      next: (itemsResponse) => {
        if (requestId !== this.loadCartRequestId) return;
        this._items.set(itemsResponse);
      },
      error: () => {
        this.snackBar.open('Errore di connessione al carrello. Riprova più tardi.', 'Chiudi', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  add(product: Product): void {
    if (!this.auth.isLoggedIn()) {
      this._items.update(currentItems => {
        const existing = currentItems.find(i => i.product.id === product.id);
        let updated: CartItem[];
        if (existing) {
          updated = currentItems.map(i =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        } else {
          updated = [...currentItems, { product, quantity: 1 }];
        }
        this.saveToStorage(updated);
        return updated;
      });
      return;
    }

    this.http.post(`/cart/add/${product.id}`, {}).subscribe({
      next: () => this.loadCart(),
      error: () => this.loadCart()
    });
  }

  remove(product: Product): void {
    if (!this.auth.isLoggedIn()) {
      this._items.update(currentItems => {
        const existing = currentItems.find(i => i.product.id === product.id);
        if (!existing) return currentItems;
        let updated: CartItem[];
        if (existing.quantity > 1) {
          updated = currentItems.map(i =>
            i.product.id === product.id ? { ...i, quantity: i.quantity - 1 } : i
          );
        } else {
          updated = currentItems.filter(i => i.product.id !== product.id);
        }
        this.saveToStorage(updated);
        return updated;
      });
      return;
    }

    this.http.delete(`/cart/remove/${product.id}`).subscribe({
      next: () => this.loadCart(),
      error: () => this.loadCart()
    });
  }

  clear(): void {
    this._items.set([]);
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  updateQuantity(productId: number, quantity: number): void {
    if (!this.auth.isLoggedIn()) {
      this._items.update(currentItems => {
        let updated: CartItem[];
        if (quantity <= 0) {
          updated = currentItems.filter(i => i.product.id !== productId);
        } else {
          updated = currentItems.map(i =>
            i.product.id === productId ? { ...i, quantity } : i
          );
        }
        this.saveToStorage(updated);
        return updated;
      });
      return;
    }

    this.http.patch(`/cart/update/${productId}`, { quantity }).subscribe({
      next: () => this.loadCart(),
      error: () => this.loadCart()
    });
  }

  syncLocalCartToServer(): void {
    const localItems = this.loadFromStorage();
    if (localItems.length === 0 || !this.auth.isLoggedIn()) {
      this.loadCart();
      return;
    }

    const payload = localItems.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity
    }));

    this.http.post('/cart/sync', { items: payload }).subscribe({
      next: () => {
        sessionStorage.removeItem(this.STORAGE_KEY);
        this.loadCart();
      },
      error: (err) => console.error("Errore durante la sincronizzazione", err)
    });
  }

  private loadFromStorage(): CartItem[] {
    const data = sessionStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(items: CartItem[]): void {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }
}
