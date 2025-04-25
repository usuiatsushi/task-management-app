import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  addTaskToCalendar(task: any): Promise<void> {
    return Promise.resolve();
  }

  updateCalendarEvent(task: any): Promise<void> {
    return Promise.resolve();
  }
} 