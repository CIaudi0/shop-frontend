import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, startWith, switchMap, tap } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { ProductService } from '../../core/services/products';
import { ProductsState } from '../../shared/http/http-state';
import { Product } from '../../core/models/product';
import { HttpStateCard } from '../../shared/http/http-state-card/http-state-card';
import { CartService } from '../../core/services/cart';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    RouterModule,
    HttpStateCard,
  ],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss'],
})
export class ProductListComponent implements OnInit {
  private router = inject(Router);
  private productService = inject(ProductService);
  private cart = inject(CartService);
  private cartService = inject(CartService);
  private snackBar = inject(MatSnackBar);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  protected filters = { title: '', minPrice: '', maxPrice: '' };

  private searchSubject$ = new BehaviorSubject<string>('');

  httpState$: Observable<ProductsState<Product>> = this.searchSubject$.pipe(
    switchMap((searchTerm) => this.productService.getProducts(searchTerm).pipe(
      tap(data => {
        this.products = data;
        this.applyLocalPriceFilters();
      }),
      map(data => ({ status: 'success', data } as ProductsState<Product>)),
      startWith({ status: 'loading' } as ProductsState<Product>),
      catchError(() => of({ status: 'error', message: 'Impossibile connettersi al Server. Assicurati che Rails sia acceso.' } as ProductsState<Product>))
    ))
  );


  reload(): void {
    this.searchSubject$.next(this.filters.title.trim());
  }

  ngOnInit(): void {
    //   this.productService.getProducts().subscribe({
    //     next: (data) => {
    //       this.products = data;
    //       this.filteredProducts = data;
    //       console.log('Prodotti scaricati con successo:', data);
    //     },
    //     error: (err) => {
    //       console.error('Errore nel caricamento prodotti:', err);
    //     },
    //   });
  }


  applyFilters(): void {
    this.searchSubject$.next(this.filters.title.trim());

    this.applyLocalPriceFilters();
  }

  private applyLocalPriceFilters(): void {
    const minPrice = this.parseNumber(this.filters.minPrice);
    const maxPrice = this.parseNumber(this.filters.maxPrice);

    this.filteredProducts = this.products.filter((product) => {
      const matchesMinPrice = minPrice === null || isNaN(minPrice) || product.price >= minPrice;
      const matchesMaxPrice = maxPrice === null || isNaN(maxPrice) || product.price <= maxPrice;
      return matchesMinPrice && matchesMaxPrice;
    });
  }

  private parseNumber(value: any): number | null {
    if (value === null || value === '' || value === undefined) return null;
    const parsed = Number(value);
    return isNaN(parsed) ? null : parsed;
  }

  addToCart(product: any): void {
    this.snackBar.open('Prodotto aggiunto al carrello!', 'Chiudi', { duration: 2000 });
    this.cartService.add(product);
  }
}