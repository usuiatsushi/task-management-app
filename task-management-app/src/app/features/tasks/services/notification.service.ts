import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, updateDoc, doc } from '@angular/fire/firestore';
import { Notification } from '../models/notification.model';
import { Timestamp } from 'firebase/firestore';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private firestore: Firestore) {}

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

  async checkTaskDeadlines(tasks: Task[]): Promise<void> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const task of tasks) {
      if (task.dueDate) {
        let dueDate: Date;
        if (task.dueDate instanceof Timestamp) {
          dueDate = task.dueDate.toDate();
        } else if (typeof task.dueDate === 'object' && 'seconds' in task.dueDate) {
          dueDate = new Date(task.dueDate.seconds * 1000);
        } else if (typeof task.dueDate === 'string') {
          dueDate = new Date(task.dueDate);
        } else {
          dueDate = new Date(task.dueDate);
        }

        if (isNaN(dueDate.getTime())) {
          console.error('Invalid due date for task:', task);
          continue;
        }

        // 期限が明日のタスクをチェック
        if (dueDate.toDateString() === tomorrow.toDateString()) {
          await this.showNotification(
            '期限が近づいています',
            `タスク「${task.title}」の期限が明日です。`
          );
        }
      }
    }
  }

  async showNotification(title: string, message: string): Promise<void> {
    // Implementation of showNotification method
  }
} 