import { inject, Injectable, Injector } from '@angular/core';
import { CartService } from './cart';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private injector = inject(Injector);

  getUser(): any {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64);
      return JSON.parse(decodedJson);
    } catch (error) {
      console.error('Errore nella lettura del token', error);
      return null;
    }
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  get userRole(): string {
    const user = this.getUser();
    return user ? user.role : 'user';
  }

  get isAdmin(): boolean {
    return this.userRole === 'admin';
  }

  get isVendor(): boolean {
    return this.userRole === 'vendor' || this.userRole === 'admin';
  }

  login(): void {
    window.location.href = 'http://localhost:3000/auth/google_oauth2';
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    window.location.reload();
  }

  get token(): string | null {
    return localStorage.getItem('auth_token');
  }

  saveToken(token: string): void {
    localStorage.setItem('auth_token', token);
    const cartService = this.injector.get(CartService);
    cartService.syncLocalCartToServer();
  }
}

