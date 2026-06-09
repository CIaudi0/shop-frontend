import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap, startWith, catchError, of, map, debounceTime } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProductService, ProductsMeta } from '../../core/services/products';
import { Product } from '../../core/models/product';
import { CartService } from '../../core/services/cart';
import { HttpState } from '../../shared/http/http-state';
import { HttpStateCard } from '../../shared/http/http-state-card/http-state-card';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, RouterModule, HttpStateCard
  ],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss'],
})
export class ProductListComponent {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  public searchTitle = signal('');
  public currentPage = signal(1);
  public state = signal<HttpState<Product>>({ status: 'loading' });
  public meta = signal<ProductsMeta | null>(null);

  // Computed signal type-safe: evita di accedere a state().data direttamente nel template
  public products = computed<Product[]>(() => {
    const s = this.state();
    return s.status === 'success' ? s.data : [];
  });

  private readonly trigger$ = new Subject<{ q: string; page: number }>();

  constructor() {
    this.trigger$.pipe(
      debounceTime(300),
      switchMap(({ q, page }) =>
        this.productService.getProducts(q || undefined, page).pipe(
          map(response => ({
            status: 'success' as const,
            data: response.products,
            meta: response.meta
          })),
          catchError(() =>
            of({ status: 'error' as const, message: 'Errore nel caricamento dei prodotti.' })
          ),
          startWith({ status: 'loading' as const })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      if (result.status === 'success') {
        this.state.set({ status: 'success', data: result.data });
        this.meta.set(result.meta);
      } else {
        this.state.set(result as HttpState<Product>);
      }
    });

    this.trigger$.next({ q: '', page: 1 });
  }

  onSearchChange(q: string): void {
    this.searchTitle.set(q);
    this.currentPage.set(1);
    this.trigger$.next({ q, page: 1 });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.trigger$.next({ q: this.searchTitle(), page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  reload(): void {
    this.trigger$.next({ q: this.searchTitle(), page: this.currentPage() });
  }

  addToCart(product: Product): void {
    this.cartService.add(product);
    if (product.stock > 0) {
      this.snackBar.open('Prodotto aggiunto al carrello!', 'Chiudi', {
        duration: 2000, horizontalPosition: 'center', verticalPosition: 'bottom'
      });
    }
  }
}
