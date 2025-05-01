import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private readonly API_KEY = environment.googleCalendar.apiKey;
  private readonly CALENDAR_ID = 'primary';

  constructor(private http: HttpClient) {}

  // カレンダーイベントを作成
  createEvent(event: any): Observable<any> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${this.CALENDAR_ID}/events?key=${this.API_KEY}`;
    return this.http.post(url, event);
  }

  // カレンダーイベントを更新
  updateEvent(eventId: string, event: any): Observable<any> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${this.CALENDAR_ID}/events/${eventId}?key=${this.API_KEY}`;
    return this.http.put(url, event);
  }

  // カレンダーイベントを削除
  deleteEvent(eventId: string): Observable<any> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${this.CALENDAR_ID}/events/${eventId}?key=${this.API_KEY}`;
    return this.http.delete(url);
  }

  // タスクからカレンダーイベントを作成
  createEventFromTask(task: any) {
    const event = {
      summary: task.title,
      description: task.description,
      start: {
        dateTime: task.dueDate,
        timeZone: 'Asia/Tokyo'
      },
      end: {
        dateTime: task.dueDate,
        timeZone: 'Asia/Tokyo'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };

    return this.createEvent(event);
  }
} 