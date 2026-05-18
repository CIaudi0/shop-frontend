import { inject, Injectable, Injector, signal, computed } from '@angular/core';
import { CartService } from './cart';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private injector = inject(Injector);

  private _token = signal<string | null>(localStorage.getItem('auth_token'));

  public readonly isLoggedIn = computed(() => !!this._token());

  public readonly currentUser = computed(() => {
    const currentToken = this._token();
    if (!currentToken) return null;

    try {
      const payloadBase64 = currentToken.split('.')[1];
      const decodedJson = atob(payloadBase64);
      return JSON.parse(decodedJson);
    } catch (error) {
      console.error(error);
      return null;
    }
  });

  public readonly userRole = computed(() => {
    const user = this.currentUser();
    return user ? user.role : 'user';
  });

  public readonly isAdmin = computed(() => this.userRole() === 'admin');
  public readonly isVendor = computed(() => this.userRole() === 'vendor' || this.userRole() === 'admin');

  public readonly token = this._token.asReadonly();

  login(): void {
    window.location.href = 'http://localhost:3000/auth/google_oauth2';
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this._token.set(null); 
  }

  saveToken(token: string): void {
    localStorage.setItem('auth_token', token);
    this._token.set(token);
    
    const cartService = this.injector.get(CartService);
    cartService.syncLocalCartToServer();
  }
}