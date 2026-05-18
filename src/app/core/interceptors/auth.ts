import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';
import { environment } from '../../../environments';


export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService) as AuthService;
  const router = inject(Router);
  const token = auth.token();
  const apiUrl = environment.apiUrl;

  let modifiedReq = req;

  if (req.url.startsWith('/')) {
    let headers = req.headers;
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    modifiedReq = req.clone({
      url: `${apiUrl}${req.url}`,
      headers
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('Token scaduto o non valido. Logout automatico...');
        auth.logout(); 
        router.navigate(['/']); 
      }
      
      return throwError(() => error);
    })
  );
};