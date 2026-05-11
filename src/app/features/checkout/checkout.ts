import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { CartService } from '../../core/services/cart';
import { OrderService } from '../../core/services/order';
import { Order } from '../../core/models/order';
import { AuthService } from '../../core/services/auth';

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
    MatIconModule
  ],
  templateUrl: './checkout.html'
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);

  public cartService = inject(CartService);
  private orderService = inject(OrderService);
  public auth = inject(AuthService);

  showSummary = false;
  loading = false;
  orderSuccess = false;
  orderError = false;

  public readonly groupedItems = computed(() => {
    const items = this.cartService.items();
    const grouped = new Map<string, any>();

    items.forEach(item => {
      const idStr = item.id.toString();
      if (grouped.has(idStr)) {
        grouped.get(idStr).quantity++;
      } else {
        grouped.set(idStr, { ...item, price: Number(item.price), quantity: 1 });
      }
    });

    return Array.from(grouped.values());
  });

  public readonly totalPrice = computed(() =>
    this.groupedItems().reduce((sum, item) => sum + item.price * item.quantity, 0)
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

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      const user = this.auth.currentUser();
      if (user) {
        this.form.get('customer')?.patchValue({
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          email: user.email || ''
        });
      }
    }
  }

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
    this.cartService.remove(product);
  }

  increaseQuantity(item: any): void {
    this.cartService.updateQuantity(item.id, item.quantity + 1);
  }

  decreaseQuantity(item: any): void {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.id, item.quantity - 1);
    } else {
      this.cartService.remove(item);
    }
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

    const value = this.form.getRawValue() as any;

    const order: Order = {
      customer: value.customer,
      address: value.address,
      items: this.cartService.items(),
      total: this.totalPrice(),
      createdAt: new Date().toISOString()
    };

    this.orderService.create(order).subscribe({
      next: () => {
        this.loading = false;
        this.orderSuccess = true;
        this.cartService.clear();
        this.form.reset();
        this.showSummary = false;
      },
      error: (err) => {
        console.error('Errore salvataggio ordine:', err);
        this.loading = false;
        this.orderError = true;
      }
    });
  }
}