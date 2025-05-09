import { Component, Input, OnInit } from '@angular/core';
import { Task } from 'src/app/features/tasks/models/task.model';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { TaskDetailDialogComponent } from '../tasks/components/task-detail-dialog/task-detail-dialog.component';

function toDate(d: any): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (typeof d === 'string' || typeof d === 'number') return new Date(d);
  if ('toDate' in d && typeof d.toDate === 'function') return d.toDate();
  if ('seconds' in d) return new Date(d.seconds * 1000);
  return null;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    DragDropModule
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  @Input() tasks: Task[] = [];
  @Input() onTaskUpdate: ((task: Task) => Promise<void>) | null = null;

  currentDate: Date = new Date();
  currentMonth: Date = new Date();
  weeks: Date[][] = [];
  weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  constructor(private dialog: MatDialog) {}

  ngOnInit() {
    this.generateCalendar();
  }

  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    // 月の最初の日
    const firstDay = new Date(year, month, 1);
    // 月の最後の日
    const lastDay = new Date(year, month + 1, 0);
    
    // カレンダーの最初の日（前月の日付を含む）
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // カレンダーの最後の日（次月の日付を含む）
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    this.weeks = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      this.weeks.push(week);
    }
  }

  getTasksForDate(date: Date): Task[] {
    return this.tasks.filter(task => {
      const taskDate = toDate(task.dueDate);
      if (!taskDate) return false;
      return taskDate.getDate() === date.getDate() &&
             taskDate.getMonth() === date.getMonth() &&
             taskDate.getFullYear() === date.getFullYear();
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth.getMonth();
  }

  previousMonth() {
    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
    this.generateCalendar();
  }

  getTaskStatusClass(task: Task): string {
    switch (task.status) {
      case '完了':
        return 'completed';
      case '進行中':
        return 'in-progress';
      case '未着手':
        return 'not-started';
      default:
        return '';
    }
  }

  getTaskPriorityClass(task: Task): string {
    switch (task.priority) {
      case '高':
        return 'high-priority';
      case '中':
        return 'medium-priority';
      case '低':
        return 'low-priority';
      default:
        return '';
    }
  }

  onTaskDrop(event: CdkDragDrop<Task[]>, targetDate: Date) {
    const task = event.item.data;
    const newDueDate = new Date(targetDate);
    newDueDate.setHours(0, 0, 0, 0);

    if (this.onTaskUpdate) {
      this.onTaskUpdate({
        ...task,
        dueDate: newDueDate
      });
    }
  }

  openTaskDetail(task: Task) {
    this.dialog.open(TaskDetailDialogComponent, {
      width: '600px',
      data: { task }
    });
  }
} 