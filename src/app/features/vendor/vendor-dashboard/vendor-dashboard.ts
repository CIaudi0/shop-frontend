import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // <-- AGGIUNTI
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
  template: `
    <div style="max-width: 800px; margin: 3rem auto; padding: 0 20px;">
      <mat-card class="mat-elevation-z4" style="padding: 20px;">
        <mat-card-header style="margin-bottom: 20px; display: flex; justify-content: center;">
          <mat-card-title style="font-size: 1.8rem;">
            {{ isEditMode ? 'Modifica Prodotto' : 'Aggiungi Nuovo Prodotto' }}
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="productForm" (ngSubmit)="onSubmit()" style="display: flex; flex-direction: column; gap: 16px;">
            
            <mat-form-field appearance="outline">
              <mat-label>Titolo del Prodotto</mat-label>
              <input matInput formControlName="title" placeholder="Es. T-Shirt Bianca in Cotone">
            </mat-form-field>

            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
              <mat-form-field appearance="outline" style="flex: 1; min-width: 200px;">
                <mat-label>Prezzo (€)</mat-label>
                <input matInput type="number" formControlName="price">
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Link Immagine (URL)</mat-label>
              <input matInput formControlName="thumbnail">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Descrizione Dettagliata</mat-label>
              <textarea matInput formControlName="description" rows="5"></textarea>
            </mat-form-field>

            <div style="text-align: right; margin: auto; margin-top: 10px; display: flex; justify-content: flex; gap: 10px;">
              <button mat-button type="button" (click)="goBack()">Annulla</button>
              
              <button mat-raised-button color="primary" type="submit" [disabled]="productForm.invalid" style="padding: 8px 32px; font-size: 1.1rem;">
                {{ isEditMode ? 'Salva' : 'Pubblica' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class VendorDashboardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private vendorService = inject(VendorService);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  isEditMode = false;
  productId: string | null = null;

  productForm = this.fb.group({
    title: ['', Validators.required],
    price: ['', [Validators.required, Validators.min(0.01)]],
    thumbnail: ['', Validators.required],
    description: ['', Validators.required]
  });

  ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id');

    if (this.productId) {
      this.isEditMode = true;
      this.vendorService.getProduct(this.productId).subscribe({
        next: (product) => {
          this.productForm.patchValue(product);
        },
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
        error: () => this.snackBar.open("Errore durante il salvataggio.", 'Chiudi', { duration: 2000 })
      });
    } else {
      this.vendorService.createProduct(this.productForm.value).subscribe({
        next: () => {
          this.snackBar.open('Prodotto aggiunto con successo!', 'Chiudi', { duration: 4000 });
          this.productForm.reset();
        },
        error: () => this.snackBar.open("Errore durante l'inserimento.", 'Chiudi', { duration: 2000 })
      });
    }
  }

  goBack() {
    this.location.back();
  }
}