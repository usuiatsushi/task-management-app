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

  private convertTimestampToDate(timestamp: Timestamp | null): Date | null {
    if (!timestamp) return null;
    return timestamp.toDate();
  }

  private convertDateToTimestamp(date: Date | null): Timestamp | null {
    if (!date) return null;
    return Timestamp.fromDate(date);
  }

  private getTaskDueDate(task: Task): Date | null {
    if (!task.dueDate) return null;
    return this.convertTimestampToDate(task.dueDate);
  }

  async addTaskToCalendar(task: Task): Promise<void> {
    const dueDate = this.getTaskDueDate(task);
    if (!dueDate) return;

    // カレンダーイベントの作成処理
    const event = {
      summary: task.title,
      description: task.description,
      start: {
        dateTime: dueDate.toISOString(),
        timeZone: 'Asia/Tokyo'
      },
      end: {
        dateTime: dueDate.toISOString(),
        timeZone: 'Asia/Tokyo'
      }
    };

    try {
      const response = await this.http.post(
        `${this.CALENDAR_API_URL}/calendars/${this.CALENDAR_ID}/events`,
        event,
        { headers: await this.getAuthHeaders() }
      ).toPromise();
      
      if (response && 'id' in response) {
        const taskRef = doc(this.firestore, 'tasks', task.id);
        await updateDoc(taskRef, { calendarEventId: response.id });
        console.log('カレンダーイベントIDを保存しました:', response.id);
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
        const dueDate = this.getTaskDueDate(task);
        if (!dueDate) return;

        if (isNaN(dueDate.getTime())) {
          throw new Error('Invalid due date');
        }

        // 日本時間に合わせる
        const jstDate = new Date(dueDate.getTime() + (9 * 60 * 60 * 1000));
        const formattedDate = jstDate.toISOString().split('T')[0];

        const event = {
          summary: task.title,
          description: task.description,
          start: {
            date: formattedDate,
            timeZone: 'Asia/Tokyo'
          },
          end: {
            date: formattedDate,
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
      console.log('カレンダーイベントの削除を開始:', task.calendarEventId);
      
      if (!task.calendarEventId) {
        console.warn('削除するカレンダーイベントIDが存在しません');
        return;
      }

      const headers = await this.getAuthHeaders();
      console.log('認証ヘッダーを取得しました');

      try {
        const response = await this.http.delete(
          `${this.CALENDAR_API_URL}/calendars/${this.CALENDAR_ID}/events/${task.calendarEventId}`,
          { headers }
        ).toPromise();

        console.log('カレンダーイベントの削除が成功しました:', task.calendarEventId);
        this.snackBar.open('カレンダーからイベントを削除しました', '閉じる', { duration: 3000 });
      } catch (error: any) {
        // 410 Goneエラーの場合は、イベントがすでに削除されているとみなして処理を続行
        if (error.status === 410) {
          console.log('カレンダーイベントはすでに削除されています:', task.calendarEventId);
          return;
        }
        throw error;
      }
    } catch (error: any) {
      console.error('カレンダーからの削除に失敗しました:', error);
      if (error.status === 404) {
        console.warn('カレンダーイベントが見つかりませんでした:', task.calendarEventId);
        this.snackBar.open('カレンダーイベントが見つかりませんでした', '閉じる', { duration: 3000 });
      } else if (error.status === 403) {
        console.error('カレンダーへのアクセス権限がありません');
        this.snackBar.open('カレンダーへのアクセス権限がありません', '閉じる', { duration: 3000 });
      } else {
        this.snackBar.open('カレンダーからの削除に失敗しました', '閉じる', { duration: 3000 });
      }
      throw error;
    }
  }
} 