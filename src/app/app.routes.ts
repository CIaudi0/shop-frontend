import { Routes } from '@angular/router';
import { CheckoutComponent } from './features/checkout/checkout';
import { ProductDetailPage } from './features/product-detail-page/product-detail-page';
import { checkoutGuard } from './core/guard/checkout-guard';
import { adminGuard } from './core/guard/admin-guard';
import { VendorDashboardComponent } from './features/vendor/vendor-dashboard/vendor-dashboard';
import { vendorGuard } from './core/guard/vendor-guard';
import { OrdersComponent } from './features/orders/orders';
import { authGuard } from './core/guard/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/product/product-list').then((m) => m.ProductListComponent),
  },
  { path: 'products/:id', component: ProductDetailPage },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout').then(m => m.CheckoutComponent)
  },
  {
    path: 'login/success',
    loadComponent: () => import('./features/auth/login-success').then(m => m.LoginSuccessComponent)
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./features/admin/admin-dashboard').then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'vendor/dashboard',
    loadComponent: () => import('./features/vendor/vendor-dashboard/vendor-dashboard').then(m => m.VendorDashboardComponent),
    canActivate: [vendorGuard]
  },
  {
    path: 'products/edit/:id',
    component: VendorDashboardComponent,
    canActivate: [vendorGuard]
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/orders/orders').then(m => m.OrdersComponent),
    canActivate: [authGuard]
  },

];