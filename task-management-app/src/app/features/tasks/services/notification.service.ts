import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Task } from '../models/task.model';
import { Timestamp } from 'firebase/firestore';

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
          warningTasks.push(task);
        } else if (dueDate < now) {
          overdueTasks.push(task);
        }
      }
    });

    // 期限切迫タスクの通知を順番に表示
    this.showMultipleSnackbars(warningTasks, (task) => {
      const daysUntilDue = this.calculateDaysUntilDue(task.dueDate);
      return `タスク「${task.title}」の期限が${daysUntilDue}日後に迫っています`;
    }, 'warning-notification');

    // 期限超過タスクの通知を順番に表示
    this.showMultipleSnackbars(overdueTasks, (task) => {
      const overdueDays = this.calculateOverdueDays(task.dueDate);
      return `タスク「${task.title}」の期限が${overdueDays}日超過しています`;
    }, 'error-notification');
  }

  private showMultipleSnackbars(tasks: Task[], getMessage: (task: Task) => string, panelClass: string) {
    if (!tasks.length) return;
    let idx = 0;
    const showNext = () => {
      if (idx >= tasks.length) return;
      const task = tasks[idx];
      const message = getMessage(task);
      const ref = this.snackBar.open(message, '確認', {
        duration: this.NOTIFICATION_DURATION,
        panelClass: [panelClass]
      });
      idx++;
      ref.afterDismissed().subscribe(() => {
        showNext();
      });
    };
    showNext();
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