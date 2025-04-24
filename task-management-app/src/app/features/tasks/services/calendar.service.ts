import { Injectable } from '@angular/core';
import { Task } from '../models/task.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Timestamp } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private readonly CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';
  private readonly CALENDAR_ID = 'primary';

  constructor(private snackBar: MatSnackBar) {}

  async addTaskToCalendar(task: Task): Promise<void> {
    try {
      const dueDate = task.dueDate instanceof Timestamp ? task.dueDate.toDate() : task.dueDate;
      const event = {
        summary: task.title,
        description: task.description,
        start: {
          dateTime: dueDate.toISOString(),
          timeZone: 'Asia/Tokyo'
        },
        end: {
          dateTime: new Date(dueDate.getTime() + 60 * 60 * 1000).toISOString(), // 1時間後
          timeZone: 'Asia/Tokyo'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1日前
            { method: 'popup', minutes: 30 } // 30分前
          ]
        }
      };

      // TODO: Google Calendar APIを使用してイベントを追加
      // const response = await this.http.post(`${this.CALENDAR_API_URL}/calendars/${this.CALENDAR_ID}/events`, event).toPromise();
      
      this.snackBar.open('カレンダーにタスクを追加しました', '閉じる', { duration: 3000 });
    } catch (error) {
      console.error('カレンダーへの追加に失敗しました:', error);
      this.snackBar.open('カレンダーへの追加に失敗しました', '閉じる', { duration: 3000 });
    }
  }

  async updateCalendarEvent(task: Task): Promise<void> {
    try {
      const dueDate = task.dueDate instanceof Timestamp ? task.dueDate.toDate() : task.dueDate;
      const event = {
        summary: task.title,
        description: task.description,
        start: {
          dateTime: dueDate.toISOString(),
          timeZone: 'Asia/Tokyo'
        },
        end: {
          dateTime: new Date(dueDate.getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'Asia/Tokyo'
        }
      };

      // TODO: Google Calendar APIを使用してイベントを更新
      // const response = await this.http.put(`${this.CALENDAR_API_URL}/calendars/${this.CALENDAR_ID}/events/${task.calendarEventId}`, event).toPromise();
      
      this.snackBar.open('カレンダーのイベントを更新しました', '閉じる', { duration: 3000 });
    } catch (error) {
      console.error('カレンダーの更新に失敗しました:', error);
      this.snackBar.open('カレンダーの更新に失敗しました', '閉じる', { duration: 3000 });
    }
  }

  async deleteCalendarEvent(task: Task): Promise<void> {
    try {
      // TODO: Google Calendar APIを使用してイベントを削除
      // await this.http.delete(`${this.CALENDAR_API_URL}/calendars/${this.CALENDAR_ID}/events/${task.calendarEventId}`).toPromise();
      
      this.snackBar.open('カレンダーからイベントを削除しました', '閉じる', { duration: 3000 });
    } catch (error) {
      console.error('カレンダーからの削除に失敗しました:', error);
      this.snackBar.open('カレンダーからの削除に失敗しました', '閉じる', { duration: 3000 });
    }
  }
} 