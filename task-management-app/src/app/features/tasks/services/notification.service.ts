import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly NOTIFICATION_DURATION = 5000; // 5秒間表示
  private readonly WARNING_DAYS = 3; // 期限の3日前から警告
  private notifiedTasks = new Set<string>(); // 通知済みのタスクを記録

  constructor(private snackBar: MatSnackBar) {}

  checkTaskDeadlines(tasks: Task[]): void {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // 時刻部分をリセット
    const warningDate = new Date(now.getTime() + this.WARNING_DAYS * 24 * 60 * 60 * 1000);

    tasks.forEach(task => {
      if (task.status !== '完了' && task.dueDate && !this.notifiedTasks.has(task.id)) {
        const dueDate = new Date(task.dueDate.seconds * 1000);
        dueDate.setHours(0, 0, 0, 0); // 時刻部分をリセット
        
        // 期限切れの場合
        if (dueDate < now) {
          this.showDeadlineOverdue(task);
          this.notifiedTasks.add(task.id);
        }
        // 期限が近づいている場合（3日以内）
        else if (dueDate <= warningDate) {
          this.showDeadlineWarning(task);
          this.notifiedTasks.add(task.id);
        }
      }
    });

    // 24時間ごとに通知履歴をリセット
    setTimeout(() => {
      this.notifiedTasks.clear();
    }, 24 * 60 * 60 * 1000);
  }

  private showDeadlineWarning(task: Task): void {
    const daysUntilDue = this.calculateDaysUntilDue(task.dueDate);
    let message: string;
    
    if (daysUntilDue === 0) {
      message = `タスク「${task.title}」の期限は今日です`;
    } else if (daysUntilDue === 1) {
      message = `タスク「${task.title}」の期限は明日です`;
    } else {
      message = `タスク「${task.title}」の期限まであと${daysUntilDue}日です`;
    }
    
    this.snackBar.open(message, '確認', {
      duration: this.NOTIFICATION_DURATION,
      panelClass: ['warning-notification']
    });
  }

  private showDeadlineOverdue(task: Task): void {
    const overdueDays = this.calculateOverdueDays(task.dueDate);
    let message: string;
    
    if (overdueDays === 1) {
      message = `タスク「${task.title}」の期限が1日超過しています`;
    } else {
      message = `タスク「${task.title}」の期限が${overdueDays}日超過しています`;
    }
    
    this.snackBar.open(message, '確認', {
      duration: this.NOTIFICATION_DURATION,
      panelClass: ['error-notification']
    });
  }

  private calculateDaysUntilDue(dueDate: { seconds: number; nanoseconds: number }): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate.seconds * 1000);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateOverdueDays(dueDate: { seconds: number; nanoseconds: number }): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate.seconds * 1000);
    due.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
} 