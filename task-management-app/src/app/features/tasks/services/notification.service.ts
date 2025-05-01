import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, updateDoc, doc } from '@angular/fire/firestore';
import { Notification } from '../models/notification.model';
import { Timestamp } from 'firebase/firestore';

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

  async checkTaskDeadlines(tasks: any[]): Promise<void> {
    const now = new Date();
    for (const task of tasks) {
      if (task.dueDate && task.dueDate.toDate() < now && task.status !== '完了') {
        await this.createNotification({
          type: 'deadline',
          userId: task.userId,
          taskId: task.id,
          message: `タスク「${task.title}」の期限が過ぎています`,
          createdAt: Timestamp.now(),
          isRead: false
        });
        }
      }
  }
} 