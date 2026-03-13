import { AsyncPipe, CurrencyPipe, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { switchMap, map, Observable } from 'rxjs';
import { ProductService } from '../../core/services/products';
import { CartService } from '../../core/services/cart';
import { MatIcon } from "@angular/material/icon";
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth';
import { HttpClient } from '@angular/common/http';
import { ConfirmDialogComponent } from '../../shared/component/confirm';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.scss',
  imports: [RouterModule, AsyncPipe, MatCardModule, MatButtonModule, CurrencyPipe, MatIcon],
})
export class ProductDetailPage {
  private route = inject(ActivatedRoute);
  private svc = inject(ProductService);
  private location = inject(Location);
  private cartService = inject(CartService);
  private snackBar = inject(MatSnackBar);
  protected auth = inject(AuthService);
  private router = inject(Router);
  protected productService = inject(ProductService);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);

  readonly product$ = this.route.paramMap.pipe(
    map((params) => params.get('id') as string),
    switchMap((id) => this.svc.getById(id)),
  );

  goBack(): void {
    this.location.back();
  }

  addToCart(product: any): void {
    this.snackBar.open('Prodotto aggiunto al carrello!', 'Chiudi', { duration: 2000 });
    this.cartService.add(product);
  }

  removeProduct(product: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe((confermato: boolean) => {

      if (confermato) {

        this.productService.removeById(product.id).subscribe({
          next: () => {
            this.snackBar.open('Prodotto rimosso con successo!', 'Chiudi', { duration: 2000 });
            this.router.navigate(['/products']);
          },
          error: (err) => {
            console.error(err);
            this.snackBar.open("Errore durante l'eliminazione.", 'Chiudi', { duration: 2000 });
          }
        });

      }
    });
  }

  updateProduct(product: any): void {
    this.router.navigate(['/products/edit', product.id]);
  }
}
