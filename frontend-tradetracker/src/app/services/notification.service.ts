import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  autoClose: boolean;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  private counter = 0;

  constructor() { }

  // Observable que les composants peuvent écouter
  getNotifications(): Observable<Notification> {
    return this.notificationSubject.asObservable();
  }

  // Méthodes pour créer différents types de notifications
  success(message: string, autoClose = true, duration = 5000): void {
    this.addNotification({
      id: this.getNextId(),
      type: NotificationType.SUCCESS,
      message,
      autoClose,
      duration
    });
  }

  error(message: string, autoClose = true, duration = 5000): void {
    this.addNotification({
      id: this.getNextId(),
      type: NotificationType.ERROR,
      message,
      autoClose,
      duration
    });
  }

  warning(message: string, autoClose = true, duration = 5000): void {
    this.addNotification({
      id: this.getNextId(),
      type: NotificationType.WARNING,
      message,
      autoClose,
      duration
    });
  }

  info(message: string, autoClose = true, duration = 5000): void {
    this.addNotification({
      id: this.getNextId(),
      type: NotificationType.INFO,
      message,
      autoClose,
      duration
    });
  }

  // Méthode pour supprimer une notification
  remove(id: number): void {
    // Créer un objet spécial pour la suppression avec une propriété 'removeOnly' pour indiquer qu'il s'agit d'une suppression
    this.notificationSubject.next({
      id,
      type: NotificationType.INFO,
      message: '',
      autoClose: false,
      removeOnly: true // Propriété spéciale pour identifier les suppressions
    } as Notification);
  }

  private addNotification(notification: Notification): void {
    this.notificationSubject.next(notification);
  }

  private getNextId(): number {
    return this.counter++;
  }
}
