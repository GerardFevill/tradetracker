import { Injectable } from '@angular/core';
import { 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpInterceptor, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { NotificationService } from './notification.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  constructor(private notificationService: NotificationService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.activeRequests++;
    
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';
        
        if (error.error instanceof ErrorEvent) {
          // Erreur côté client
          errorMessage = `Erreur: ${error.error.message}`;
        } else {
          // Erreur côté serveur
          switch (error.status) {
            case 0:
              errorMessage = 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion.';
              break;
            case 400:
              errorMessage = 'Requête incorrecte. Veuillez vérifier vos données.';
              break;
            case 401:
              errorMessage = 'Vous n\'êtes pas autorisé à accéder à cette ressource.';
              break;
            case 403:
              errorMessage = 'Accès refusé.';
              break;
            case 404:
              errorMessage = 'La ressource demandée n\'a pas été trouvée.';
              break;
            case 500:
              errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
              break;
            default:
              errorMessage = `Erreur ${error.status}: ${error.statusText || 'Une erreur est survenue'}`;
          }
        }
        
        // Afficher la notification d'erreur
        this.notificationService.error(errorMessage);
        
        // Retourner l'erreur pour que les composants puissent la gérer
        return throwError(() => error);
      }),
      finalize(() => {
        this.activeRequests--;
      })
    );
  }
}
