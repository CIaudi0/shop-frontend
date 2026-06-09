import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth';
import { environment } from '../../../environments';

// Stato condiviso per evitare refresh paralleli multipli
let isRefreshing = false;
const tokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const token  = auth.token();
  const apiUrl = environment.apiUrl;

  const isAuthEndpoint =
    req.url.includes('/auth/refresh') || req.url.includes('/auth/logout');

  let modifiedReq = req;

  if (req.url.startsWith('/')) {
    let headers = req.headers;
    if (token && !isAuthEndpoint) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    modifiedReq = req.clone({
      url: `${apiUrl}${req.url}`,
      headers,
      withCredentials: true, // necessario per inviare il cookie refresh_token
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        if (!isRefreshing) {
          isRefreshing = true;
          tokenSubject.next(null);

          return auth.tryRefresh().pipe(
            switchMap((success) => {
              isRefreshing = false;
              if (success) {
                const newToken = auth.token()!;
                tokenSubject.next(newToken);
                return next(modifiedReq.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
              } else {
                tokenSubject.next(null);
                auth.logout();
                router.navigate(['/']);
                return throwError(() => error);
              }
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              tokenSubject.next(null);
              auth.logout();
              router.navigate(['/']);
              return throwError(() => refreshError);
            })
          );
        } else {
          return tokenSubject.pipe(
            filter(t => t !== null),
            take(1),
            switchMap(newToken =>
              next(modifiedReq.clone({ setHeaders: { Authorization: `Bearer ${newToken!}` } }))
            )
          );
        }
      }
      return throwError(() => error);
    })
  );
};
