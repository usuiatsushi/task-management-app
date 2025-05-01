import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Task } from '../interfaces/task.interface';
import { Timestamp } from '@angular/fire/firestore';

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
    console.log('Creating calendar event with data:', event);
    return this.http.post(url, event).pipe(
      tap(
        response => console.log('Calendar event created successfully:', response),
        error => console.error('Error creating calendar event:', error)
      )
    );
  }

  // カレンダーイベントを更新
  updateEvent(eventId: string, event: any): Observable<any> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${this.CALENDAR_ID}/events/${eventId}?key=${this.API_KEY}`;
    console.log('Updating calendar event:', { eventId, event });
    return this.http.put(url, event).pipe(
      tap(
        response => console.log('Calendar event updated successfully:', response),
        error => console.error('Error updating calendar event:', error)
      )
    );
  }

  // カレンダーイベントを削除
  deleteEvent(eventId: string): Observable<any> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${this.CALENDAR_ID}/events/${eventId}?key=${this.API_KEY}`;
    console.log('Deleting calendar event:', { eventId });
    return this.http.delete(url).pipe(
      tap(
        response => console.log('Calendar event deleted successfully:', response),
        error => console.error('Error deleting calendar event:', error)
      )
    );
  }

  // タスクからカレンダーイベントを作成
  createEventFromTask(task: Task) {
    console.log('Creating calendar event from task:', task);
    
    if (!task.dueDate) {
      throw new Error('Due date is required for calendar event');
    }

    // 日付の変換処理
    let dueDate: Date;
    if (task.dueDate && typeof task.dueDate === 'object' && 'toDate' in task.dueDate) {
      dueDate = (task.dueDate as Timestamp).toDate();
    } else if (typeof task.dueDate === 'string') {
      dueDate = new Date(task.dueDate);
    } else if (task.dueDate && typeof task.dueDate === 'object' && 'getTime' in task.dueDate) {
      dueDate = task.dueDate as Date;
    } else {
      throw new Error('Invalid due date format');
    }

    if (isNaN(dueDate.getTime())) {
      throw new Error('Invalid due date');
    }

    // 日付をISO 8601形式に変換（タイムゾーンを考慮）
    const isoDateTime = dueDate.toISOString();
    const event = {
      summary: task.title,
      description: task.description || '',
      start: {
        dateTime: isoDateTime,
        timeZone: 'Asia/Tokyo'
      },
      end: {
        dateTime: isoDateTime,
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

    console.log('Prepared calendar event data:', event);
    return this.createEvent(event);
  }

  // タスクをカレンダーに追加
  addTaskToCalendar(task: Task): Observable<any> {
    console.log('Adding task to calendar:', task);
    return this.createEventFromTask(task);
  }

  // カレンダーイベントを更新
  updateCalendarEvent(task: Task): Observable<any> {
    console.log('Updating calendar event for task:', task);
    if (!task.calendarEventId) {
      return this.addTaskToCalendar(task);
    }
    
    if (!task.dueDate) {
      throw new Error('Due date is required for calendar event');
    }

    const dueDate = new Date(task.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new Error('Invalid due date format');
    }
    
    const isoDateTime = dueDate.toISOString();

    const event = {
      summary: task.title,
      description: task.description || '',
      start: {
        dateTime: isoDateTime,
        timeZone: 'Asia/Tokyo'
      },
      end: {
        dateTime: isoDateTime,
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

    return this.updateEvent(task.calendarEventId, event);
  }
} 