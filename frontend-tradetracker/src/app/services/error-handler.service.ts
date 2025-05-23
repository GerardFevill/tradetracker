import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  constructor(private notificationService: NotificationService) {}

  /**
   * Gestion globale des erreurs HTTP
   * @param error L'erreur HTTP
   * @param friendlyMessage Un message convivial à afficher à l'utilisateur
   * @returns Un Observable qui émet l'erreur
   */
  handleError(error: HttpErrorResponse, friendlyMessage: string = 'Une erreur est survenue'): Observable<never> {
    let errorMessage = '';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = `Code: ${error.status}, Message: ${error.message}`;
    }
    
    // Log l'erreur
    console.error(errorMessage);
    
    // Afficher une notification à l'utilisateur
    this.notificationService.error(friendlyMessage);
    
    // Retourner l'erreur pour que le composant puisse la gérer
    return throwError(() => error);
  }
}
