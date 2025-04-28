import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Task } from '../models/task.model';
import { Timestamp } from 'firebase/firestore';
import { DeadlineNotificationComponent } from '../components/deadline-notification/deadline-notification.component';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly NOTIFICATION_DURATION = 5000; // 5秒間表示
  private readonly WARNING_DAYS = 3; // 期限の3日前から警告

  constructor(private snackBar: MatSnackBar) {}

  checkTaskDeadlines(tasks: Task[]): void {
    const now = new Date();
    const warningDate = new Date(now.getTime() + this.WARNING_DAYS * 24 * 60 * 60 * 1000);
    const warnings: string[] = [];
    const overdues: string[] = [];
    const warningTasks: Task[] = [];
    const overdueTasks: Task[] = [];

    tasks.forEach(task => {
      if (task.status !== '完了' && task.dueDate) {
        const dueDate = task.dueDate instanceof Timestamp ? task.dueDate.toDate() : new Date(task.dueDate);
        if (dueDate <= warningDate && dueDate >= now) {
          const daysUntilDue = this.calculateDaysUntilDue(task.dueDate);
          const message = `タスク「${task.title}」の期限が${daysUntilDue}日後に迫っています`;
          this.snackBar.openFromComponent(DeadlineNotificationComponent, {
            data: { message },
            duration: this.NOTIFICATION_DURATION,
            panelClass: ['warning-notification']
          });
        } else if (dueDate < now) {
          const overdueDays = this.calculateOverdueDays(task.dueDate);
          const message = `タスク「${task.title}」の期限が${overdueDays}日超過しています`;
          this.snackBar.openFromComponent(DeadlineNotificationComponent, {
            data: { message },
            duration: this.NOTIFICATION_DURATION,
            panelClass: ['error-notification']
          });
        }
      }
    });
  }

  private calculateDaysUntilDue(dueDate: Timestamp | Date): number {
    const now = new Date();
    const due = dueDate instanceof Timestamp ? dueDate.toDate() : new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateOverdueDays(dueDate: Timestamp | Date): number {
    const now = new Date();
    const due = dueDate instanceof Timestamp ? dueDate.toDate() : new Date(dueDate);
    const diffTime = now.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
} 