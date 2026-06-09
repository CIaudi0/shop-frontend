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
  private snackBar = inject(MatSnackBar);
  private readonly STORAGE_KEY = 'shop_cart_data';

  private _items = signal<CartItem[]>([]);
  public readonly items = this._items.asReadonly();

  private loadCartRequestId = 0;

  public readonly totalCount = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0)
  );

  public readonly totalPrice = computed(() =>
    this._items().reduce((sum, item) => sum + item.product.price * item.quantity, 0)
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
      next: (items) => {
        if (requestId !== this.loadCartRequestId) return; 
        this._items.set(items);
      },
      error: () => {
        this.snackBar.open('Errore di connessione al carrello. Riprova più tardi.', 'Chiudi', {
          duration: 3000
        });
      }
    });
  }

  add(product: Product): void {
    if (!this.auth.isLoggedIn()) {
      this._items.update(currentItems => {
        const existing = currentItems.find(i => i.product.id === product.id);
        const currentQty = existing?.quantity ?? 0;

        if (product.stock > 0 && currentQty >= product.stock) {
          this.snackBar.open(`Stock esaurito (disponibili: ${product.stock})`, 'Chiudi', { duration: 2000 });
          return currentItems;
        }

        const updated = existing
          ? currentItems.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
          : [...currentItems, { product, quantity: 1 }];

        this.saveToStorage(updated);
        return updated;
      });
      return;
    }

    this.http.post(`/cart/add/${product.id}`, {}).subscribe({
      next: () => this.loadCart(),
      error: (err) => {
        // Il backend risponde 422 se lo stock è esaurito
        if (err.status === 422) {
          this.snackBar.open(err.error?.errors ?? 'Impossibile aggiungere al carrello', 'Chiudi', { duration: 2500 });
        }
        this.loadCart();
      }
    });
  }

  remove(product: Product): void {
    if (!this.auth.isLoggedIn()) {
      this._items.update(currentItems => {
        const existing = currentItems.find(i => i.product.id === product.id);
        if (!existing) return currentItems;
        const updated = existing.quantity > 1
          ? currentItems.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity - 1 } : i)
          : currentItems.filter(i => i.product.id !== product.id);
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
        const updated = quantity <= 0
          ? currentItems.filter(i => i.product.id !== productId)
          : currentItems.map(i => i.product.id === productId ? { ...i, quantity } : i);
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

    this.loadCartRequestId++;

    const payload = localItems.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity
    }));

    this.http.post('/cart/sync', { items: payload }).subscribe({
      next: () => {
        sessionStorage.removeItem(this.STORAGE_KEY);
        this.loadCart();
      },
      error: (err) => console.error('Errore durante la sincronizzazione', err)
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
