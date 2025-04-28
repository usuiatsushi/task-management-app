import { Injectable } from '@angular/core';
import { ToastService } from '../../../shared/services/toast.service';
import { Task } from '../models/task.model';
import { Timestamp } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private toastService: ToastService) {}

  checkTaskDeadlines(tasks: Task[]): void {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    tasks.forEach(task => {
      const dueDate = task.dueDate instanceof Timestamp ? task.dueDate.toDate() : new Date(task.dueDate);
      
      if (dueDate < now) {
        this.toastService.show(`${task.title}の期限が過ぎています`, 'error');
      } else if (dueDate <= threeDaysFromNow) {
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const diffTime = dueDateOnly.getTime() - nowDate.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysLeft === 0) {
          this.toastService.show(`${task.title}の締め切りは本日です`, 'warning');
        } else {
          this.toastService.show(`${task.title}の締め切りまであと${daysLeft}日`, 'warning');
        }
      }
    });
  }
} 