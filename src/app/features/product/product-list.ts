import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';


import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 
import { toSignal } from '@angular/core/rxjs-interop';

import { ProductService } from '../../core/services/products';
import { Product } from '../../core/models/product';
import { CartService } from '../../core/services/cart';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, RouterModule, MatProgressSpinnerModule
  ],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss'],
})
export class ProductListComponent {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private snackBar = inject(MatSnackBar);

  public products = toSignal(this.productService.getProducts());

  public searchTitle = signal('');

  public filteredProducts = computed(() => {
    const allProducts = this.products();
    if (allProducts === undefined) return undefined; 

    const title = this.searchTitle().toLowerCase().trim();

    return allProducts.filter(product => {
      return !title || product.title.toLowerCase().includes(title);
    });
  });

  addToCart(product: Product): void {
    this.cartService.add(product);
    this.snackBar.open('Prodotto aggiunto al carrello!', 'Chiudi', { 
      duration: 2000, horizontalPosition: 'center', verticalPosition: 'bottom'
    });
  }
}