import { Injectable, Inject } from '@angular/core';
import { Task } from '../models/task.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Timestamp } from 'firebase/firestore';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../../app/core/services/auth.service';
import { doc, updateDoc } from 'firebase/firestore';
import { Firestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private readonly CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';
  private readonly CALENDAR_ID = 'primary';
  private readonly SCOPES = 'https://www.googleapis.com/auth/calendar';

  constructor(
    private snackBar: MatSnackBar,
    private http: HttpClient,
    @Inject(AuthService) private authService: AuthService,
    private firestore: Firestore
  ) {}

  private async getAuthHeaders(): Promise<HttpHeaders> {
    const token = await this.authService.getGoogleAuthToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  async addTaskToCalendar(task: Task): Promise<void> {
    try {
      if (task.dueDate) {
        const dueDate = task.dueDate instanceof Timestamp ? task.dueDate.toDate() : new Date(task.dueDate);
        const event = {
          summary: task.title,
          description: task.description,
          start: {
            date: dueDate.toISOString().split('T')[0],
            timeZone: 'Asia/Tokyo'
          },
          end: {
            date: dueDate.toISOString().split('T')[0],
            timeZone: 'Asia/Tokyo'
          }
        };

        const headers = await this.getAuthHeaders();
        const response: any = await this.http.post(
          `${this.CALENDAR_API_URL}/calendars/${this.CALENDAR_ID}/events`,
          event,
          { headers }
        ).toPromise();
        
        if (response && response.id) {
          const taskRef = doc(this.firestore, 'tasks', task.id);
          await updateDoc(taskRef, { calendarEventId: response.id });
          console.log('カレンダーイベントIDを保存しました:', response.id);
        }
        
        this.snackBar.open('カレンダーにタスクを追加しました', '閉じる', { duration: 3000 });
      }
    } catch (error: any) {
      console.error('カレンダーへの追加に失敗しました:', error);
      if (error.code === 'auth/cancelled-popup-request') {
        this.snackBar.open('Google認証がキャンセルされました', '閉じる', { duration: 3000 });
      } else {
        this.snackBar.open('カレンダーへの追加に失敗しました', '閉じる', { duration: 3000 });
      }
    }
  }

  async updateCalendarEvent(task: Task): Promise<void> {
    try {
      if (task.dueDate && task.calendarEventId) {
        const dueDate = task.dueDate instanceof Timestamp ? task.dueDate.toDate() : new Date(task.dueDate);
        const event = {
          summary: task.title,
          description: task.description,
          start: {
            date: dueDate.toISOString().split('T')[0], // 日付のみを抽出
            timeZone: 'Asia/Tokyo'
          },
          end: {
            date: dueDate.toISOString().split('T')[0], // 日付のみを抽出
            timeZone: 'Asia/Tokyo'
          }
        };

        const headers = await this.getAuthHeaders();
        const response = await this.http.put(
          `${this.CALENDAR_API_URL}/calendars/${this.CALENDAR_ID}/events/${task.calendarEventId}`,
          event,
          { headers }
        ).toPromise();
        
        this.snackBar.open('カレンダーのイベントを更新しました', '閉じる', { duration: 3000 });
      }
    } catch (error) {
      console.error('カレンダーの更新に失敗しました:', error);
      this.snackBar.open('カレンダーの更新に失敗しました', '閉じる', { duration: 3000 });
    }
  }

  async deleteCalendarEvent(task: Task): Promise<void> {
    try {
      if (task.calendarEventId) {
        const headers = await this.getAuthHeaders();
        await this.http.delete(
          `${this.CALENDAR_API_URL}/calendars/${this.CALENDAR_ID}/events/${task.calendarEventId}`,
          { headers }
        ).toPromise();
      
        this.snackBar.open('カレンダーからイベントを削除しました', '閉じる', { duration: 3000 });
      }
    } catch (error) {
      console.error('カレンダーからの削除に失敗しました:', error);
      this.snackBar.open('カレンダーからの削除に失敗しました', '閉じる', { duration: 3000 });
    }
  }
} 