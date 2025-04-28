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
        this.toastService.show(`${task.title}の期限が近づいています`, 'warning');
      }
    });
  }
} 