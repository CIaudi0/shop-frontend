import { ApplicationConfig, provideAppInitializer, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { httpErrorInterceptor } from './core/interceptors/http.error';
import { authInterceptor } from './core/interceptors/auth';
import { AuthService } from './core/services/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpErrorInterceptor, authInterceptor])),
    // Blocca il rendering finché non sappiamo se l'utente ha un refresh token valido.
    // Elimina il flash di stato "non loggato" all'avvio per utenti con sessione attiva.
    provideAppInitializer(async () => {
      await firstValueFrom(inject(AuthService).tryRefresh());
    }),
  ],
};
