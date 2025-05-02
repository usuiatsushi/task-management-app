import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, updateDoc, doc } from '@angular/fire/firestore';
import { Notification } from '../models/notification.model';
import { Timestamp } from 'firebase/firestore';
import { Task } from '../models/task.model';
import { TaskService } from './task.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private firestore: Firestore, private taskService: TaskService) {}

  async createNotification(notification: Omit<Notification, 'id'>): Promise<string> {
    const notificationsRef = collection(this.firestore, 'notifications');
    const docRef = await addDoc(notificationsRef, notification);
    return docRef.id;
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const notificationsRef = collection(this.firestore, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(this.firestore, 'notifications', notificationId);
    await updateDoc(notificationRef, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getUnreadNotifications(userId);
    await Promise.all(notifications.map(notification => this.markAsRead(notification.id!)));
  }

  private convertTimestampToDate(timestamp: Timestamp | null): Date | null {
    if (!timestamp) return null;
    return timestamp.toDate();
  }

  private getTaskDueDate(task: Task): Date | null {
    if (!task.dueDate) return null;
    return this.convertTimestampToDate(task.dueDate);
  }

  async checkDeadlineReminders(): Promise<void> {
    try {
      const tasks = await this.taskService.getTasks();
      const now = new Date();

      for (const task of tasks) {
        if (task.completed) continue;

        const dueDate = this.getTaskDueDate(task);
        if (!dueDate) continue;

        const timeDiff = dueDate.getTime() - now.getTime();
        const hoursUntilDue = timeDiff / (1000 * 60 * 60);

        if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
          await this.sendDeadlineReminder(task);
        }
      }
    } catch (error) {
      console.error('期限リマインダーのチェックに失敗しました:', error);
    }
  }

  private async sendDeadlineReminder(task: Task): Promise<void> {
    const notification: Omit<Notification, 'id'> = {
      type: 'deadline',
      userId: task.userId,
      taskId: task.id,
      message: `タスク「${task.title}」の期限が近づいています。`,
      createdAt: Timestamp.now(),
      isRead: false
    };

    await this.createNotification(notification);
  }

  async showNotification(title: string, message: string): Promise<void> {
    // Implementation of showNotification method
  }
} 