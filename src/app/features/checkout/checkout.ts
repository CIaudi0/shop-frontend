import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, take } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Per lo spinner di caricamento

import { CartService } from '../../core/services/cart';
import { OrderService } from '../../core/services/order';
import { Order } from '../../core/models/order';
import { AuthService } from '../../core/services/auth';
import { RouterLink } from "@angular/router";
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    RouterLink,
    MatIcon
],
  templateUrl: './checkout.html'
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  
  private cart = inject(CartService);
  private orderService = inject(OrderService);

  showSummary = false;
  
  loading = false;
  orderSuccess = false;
  orderError = false;

  readonly items$ = this.cart.list();
  readonly total$ = this.items$.pipe(
    map(items => items.reduce((sum, item) => sum + Number(item.price), 0))
  );

  readonly form = this.fb.group({
    customer: this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    }),
    address: this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      zip: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]]
    }),
    shippingMethod: ['standard', Validators.required],
    privacy: [false, Validators.requiredTrue]
  });

  readonly groupedItems$ = this.items$.pipe(
    map(items => {
      const grouped = new Map<string, any>();
      
      items.forEach(item => {
        if (grouped.has(item.id)) {
          grouped.get(item.id).quantity++;
        } else {
          grouped.set(item.id, { ...item, quantity: 1 });
        }
      });
      
      return Array.from(grouped.values());
    })
  );
  
  getControl(path: string) { return this.form.get(path); }
  hasError(path: string, errorCode: string): boolean {
    const control = this.getControl(path);
    return !!control && control.hasError(errorCode) && control.touched;
  }
  private focusFirstInvalid(): void {
    const firstInvalid = document.querySelector('form .ng-invalid[formControlName]') as HTMLElement | null;
    firstInvalid?.focus();
  }

  removeFromCart(product: any): void {
    this.cart.remove(product);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showSummary = true;
      this.focusFirstInvalid();
      return;
    }

    this.loading = true;
    this.orderSuccess = false;
    this.orderError = false;
    
    const value = this.form.getRawValue();

    this.items$.pipe(take(1)).subscribe(items => {
      const order: Order = {
        customer: value.customer,
        address: value.address,
        items: items,
        total: items.reduce((sum, it) => sum + Number(it.price), 0),
        createdAt: new Date().toISOString()
      };

      this.orderService.create(order).subscribe({
        next: () => {
          this.loading = false;
          this.orderSuccess = true;
          this.cart.clear();
          this.form.reset();
          this.showSummary = false;
        },
        error: (err) => {
          console.error("Errore salvataggio ordine:", err);
          this.loading = false;
          this.orderError = true; 
        }
      });
    });
  }

  public auth = inject(AuthService);

  ngOnInit(): void {
    if (this.auth.isLoggedIn) {
      const user = this.auth.getUser();
      
      if (user) {
        this.form.get('customer')?.patchValue({
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          email: user.email || ''
        });
      }
    }
  }

  updateCartQuantity(productId: number, event: any): void {
    const newQuantity = Number(event.target.value);
    
    if (newQuantity > 0) {
      this.cart.updateQuantity(productId, newQuantity);
    }
  }
}