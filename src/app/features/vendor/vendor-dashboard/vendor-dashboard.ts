import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { VendorService } from '../../../core/services/vendor';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatCardModule, MatSnackBarModule
  ],
  templateUrl: './vendor-dashboard.html'
})
export class VendorDashboardComponent implements OnInit {
  private fb            = inject(FormBuilder);
  private vendorService = inject(VendorService);
  private snackBar      = inject(MatSnackBar);
  private route         = inject(ActivatedRoute);
  private location      = inject(Location);

  isEditMode = false;
  productId: string | null = null;

  productForm = this.fb.group({
    title:       ['', Validators.required],
    price:       [null as number | null, [Validators.required, Validators.min(0.01)]],
    stock:       [0, [Validators.required, Validators.min(0)]],
    thumbnail:   ['', Validators.required],
    description: ['', Validators.required]
  });

  ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id');

    if (this.productId) {
      this.isEditMode = true;
      this.vendorService.getProduct(this.productId).subscribe({
        next: (product) => this.productForm.patchValue(product),
        error: () => this.snackBar.open('Errore nel caricamento del prodotto', 'Chiudi', { duration: 2000 })
      });
    }
  }

  onSubmit() {
    if (this.productForm.invalid) return;

    if (this.isEditMode && this.productId) {
      this.vendorService.updateProduct(Number(this.productId), this.productForm.value).subscribe({
        next: () => {
          this.snackBar.open('Modifiche salvate con successo!', 'Chiudi', { duration: 4000 });
          this.goBack();
        },
        error: () => this.snackBar.open('Errore durante il salvataggio.', 'Chiudi', { duration: 2000 })
      });
    } else {
      this.vendorService.createProduct(this.productForm.value).subscribe({
        next: () => {
          this.snackBar.open('Prodotto aggiunto con successo!', 'Chiudi', { duration: 4000 });
          this.productForm.reset({ stock: 0 });
        },
        error: () => this.snackBar.open("Errore durante l'inserimento.", 'Chiudi', { duration: 2000 })
      });
    }
  }

  goBack() {
    this.location.back();
  }
}
