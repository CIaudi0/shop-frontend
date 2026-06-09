import { inject, Injectable, Injector, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment } from '../../../environments';
import { CartService } from './cart';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private injector = inject(Injector);
  private http = inject(HttpClient);

  private _token = signal<string | null>(null);

  public readonly isLoggedIn = computed(() => !!this._token());
  public readonly token = this._token.asReadonly();

  public readonly currentUser = computed(() => {
    const t = this._token();
    if (!t) return null;
    try {
      return JSON.parse(atob(t.split('.')[1]));
    } catch {
      return null;
    }
  });

  public readonly userRole = computed(() => this.currentUser()?.role ?? 'user');
  public readonly isAdmin = computed(() => this.userRole() === 'admin');
  public readonly isVendor = computed(() => this.userRole() === 'vendor' || this.userRole() === 'admin');

  tryRefresh(): Observable<boolean> {
    return this.http
      .post<{ token: string }>('/auth/refresh', {}, { withCredentials: true })
      .pipe(
        map(({ token }) => {
          this._token.set(token);
          return true;
        }),
        catchError(() => {
          this._token.set(null);
          return of(false);
        })
      );
  }

  login(): void {
    window.location.href = `${environment.apiUrl}/auth/google_oauth2`;
  }

  logout(): void {
    this.http.delete('/auth/logout', { withCredentials: true }).subscribe();
    this._token.set(null);
  }

  setToken(token: string): void {
    this._token.set(token);
    const cartService = this.injector.get(CartService);
    cartService.syncLocalCartToServer();
  }
}
