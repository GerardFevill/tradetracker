import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService, Notification, NotificationType } from '../../services/notification.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css'],
  animations: [
    trigger('notificationAnimation', [
      state('void', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      state('visible', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      transition('void => visible', animate('300ms ease-out')),
      transition('visible => void', animate('300ms ease-in'))
    ])
  ]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription: Subscription = new Subscription();
  
  // Pour accéder aux types de notification dans le template
  notificationType = NotificationType;

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.subscription = this.notificationService.getNotifications()
      .subscribe(notification => {
        // Si la notification a la propriété removeOnly, c'est une demande de suppression
        if ((notification as any).removeOnly) {
          this.removeNotification(notification.id);
          return;
        }
        
        // Ajouter la notification
        this.notifications.push(notification);
        
        // Si auto-close est activé, programmer la suppression
        if (notification.autoClose) {
          setTimeout(() => {
            this.removeNotification(notification.id);
          }, notification.duration || 5000);
        }
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  removeNotification(id: number): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  getIconClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.SUCCESS:
        return 'fas fa-check-circle';
      case NotificationType.ERROR:
        return 'fas fa-exclamation-circle';
      case NotificationType.WARNING:
        return 'fas fa-exclamation-triangle';
      case NotificationType.INFO:
      default:
        return 'fas fa-info-circle';
    }
  }
}
