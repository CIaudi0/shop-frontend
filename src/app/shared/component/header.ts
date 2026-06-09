import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { CartService } from '../../core/services/cart';
import { AuthService } from '../../core/services/auth';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatIconModule, MatButtonModule, MatBadgeModule, MatMenuModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  @Input() title: string = 'Shop Online';
  @Input() showIcon: boolean = true;

  private router = inject(Router);

  public cartService = inject(CartService);
  public auth = inject(AuthService);

  goToCheckout() {
    this.router.navigate(['/checkout']);
  }

  goToProducts() {
    this.router.navigate(['/products']);
  }

  goToAdminDashboard() {
    this.router.navigate(['/admin/dashboard']);
  }

  goToVendorDashboard() {
    this.router.navigate(['/vendor/dashboard']);
  }

  toggleLogin(): void {
    this.auth.isLoggedIn() ? this.auth.logout() : this.auth.login();
  }

  goToOrders() {
    this.router.navigate(['/orders']);
  }
}