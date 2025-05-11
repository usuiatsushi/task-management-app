import { Component, Input, OnInit } from '@angular/core';
import { Task } from 'src/app/features/tasks/models/task.model';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { TaskDetailDialogComponent } from '../tasks/components/task-detail-dialog/task-detail-dialog.component';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MoreTasksDialogComponent } from './more-tasks-dialog.component';

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
    DragDropModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule
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

  viewMode: 'month' | 'week' | 'day' = 'month';
  selectedDate: Date = new Date();

  filterStatus: string = '';
  filterImportance: string = '';
  filterAssignee: string = '';
  assigneeList: string[] = [];

  constructor(private dialog: MatDialog) {}

  ngOnInit() {
    this.generateCalendar();
    this.assigneeList = Array.from(new Set(this.tasks.map(t => t.assignedTo).filter(a => !!a)));
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
      if (taskDate.getDate() !== date.getDate() ||
          taskDate.getMonth() !== date.getMonth() ||
          taskDate.getFullYear() !== date.getFullYear()) return false;
      if (this.filterStatus && task.status !== this.filterStatus) return false;
      if (this.filterImportance && task.importance !== this.filterImportance) return false;
      if (this.filterAssignee && task.assignedTo !== this.filterAssignee) return false;
      return true;
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
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
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

  getTaskImportanceClass(task: Task): string {
    switch (task.importance) {
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

  setViewMode(mode: 'month' | 'week' | 'day') {
    this.viewMode = mode;
    if (mode === 'week') {
      this.selectedDate = new Date(this.currentDate);
    } else if (mode === 'day') {
      this.selectedDate = new Date(this.currentDate);
    }
    this.generateCalendar();
  }

  getCurrentWeek(): Date[] {
    const today = this.selectedDate;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }

  getTasksForWeek(): Task[] {
    const week = this.getCurrentWeek();
    return this.tasks.filter(task => {
      const taskDate = toDate(task.dueDate);
      if (!taskDate) return false;
      if (!week.some(date =>
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear())) return false;
      if (this.filterStatus && task.status !== this.filterStatus) return false;
      if (this.filterImportance && task.importance !== this.filterImportance) return false;
      if (this.filterAssignee && task.assignedTo !== this.filterAssignee) return false;
      return true;
    });
  }

  getTasksForDay(): Task[] {
    return this.getTasksForDate(this.selectedDate);
  }

  goToPrevious() {
    if (this.viewMode === 'month') {
      this.previousMonth();
    } else if (this.viewMode === 'week') {
      this.selectedDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate() - 7);
    } else if (this.viewMode === 'day') {
      this.selectedDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate() - 1);
    }
    this.generateCalendar();
  }

  goToNext() {
    if (this.viewMode === 'month') {
      this.nextMonth();
    } else if (this.viewMode === 'week') {
      this.selectedDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate() + 7);
    } else if (this.viewMode === 'day') {
      this.selectedDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate() + 1);
    }
    this.generateCalendar();
  }

  openMoreTasksDialog(date: Date) {
    const tasks = this.getTasksForDate(date).slice(1); // 2件目以降
    this.dialog.open(MoreTasksDialogComponent, {
      width: '400px',
      data: { tasks }
    });
  }
} 