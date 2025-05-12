import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';
import { TimelineControlsComponent } from '../timeline-controls/timeline-controls.component';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-gantt-chart',
  standalone: true,
  imports: [CommonModule, TimelineControlsComponent],
  template: `
    <div class="gantt-container">
      <app-timeline-controls (dateRangeChange)="onDateRangeChange($event)"></app-timeline-controls>
      <div #ganttChart class="gantt-chart">
        <div class="gantt-header">
          <div class="gantt-header-cell" *ngFor="let date of headerDates">
            {{ date | date:'MM/dd' }}
          </div>
        </div>
        <div class="gantt-body">
          <div class="task-row" *ngFor="let task of tasks">
            <div class="task-label">{{ task.title }}</div>
            <div class="task-bar-container">
              <div class="task-bar" *ngIf="getTaskDates(task)"
                [style.left.%]="calculatePosition(getTaskDates(task)!.start)"
                [style.width.%]="calculateWidth(getTaskDates(task)!.start, getTaskDates(task)!.end)"
                [title]="getTaskTooltip(task)">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gantt-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .gantt-chart {
      flex: 1;
      overflow: auto;
      position: relative;
      padding: 16px;
    }

    .gantt-header {
      display: flex;
      position: sticky;
      top: 0;
      background: white;
      border-bottom: 1px solid #e0e0e0;
      z-index: 1;
    }

    .gantt-header-cell {
      min-width: 100px;
      padding: 8px;
      text-align: center;
      font-weight: 500;
      color: #666;
    }

    .gantt-body {
      position: relative;
    }

    .task-row {
      display: flex;
      align-items: center;
      height: 40px;
      border-bottom: 1px solid #f0f0f0;
    }

    .task-label {
      width: 200px;
      padding: 0 16px;
      font-size: 14px;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .task-bar-container {
      flex: 1;
      position: relative;
      height: 24px;
      background: #f5f5f5;
      border-radius: 4px;
      margin: 0 8px;
    }

    .task-bar {
      position: absolute;
      height: 100%;
      background: #2196f3;
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .task-bar:hover {
      background: #1976d2;
      cursor: pointer;
    }
  `]
})
export class GanttChartComponent implements OnInit, AfterViewInit {
  @Input() tasks: Task[] = [];
  @ViewChild('ganttChart') ganttChartRef!: ElementRef;

  private startDate: Date = new Date();
  private endDate: Date = new Date();
  headerDates: Date[] = [];

  ngOnInit(): void {
    // 初期表示範囲を設定（現在の月の初日から末日まで）
    const now = new Date();
    this.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.updateHeaderDates();
  }

  ngAfterViewInit(): void {
    this.renderGanttChart();
  }

  onDateRangeChange(range: { start: Date; end: Date }): void {
    this.startDate = range.start;
    this.endDate = range.end;
    this.updateHeaderDates();
    this.renderGanttChart();
  }

  private updateHeaderDates(): void {
    this.headerDates = [];
    const currentDate = new Date(this.startDate);
    while (currentDate <= this.endDate) {
      this.headerDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  private convertToDate(date: Timestamp | { seconds: number; nanoseconds: number } | Date | string | null | undefined): Date | null {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') return new Date(date);
    if ('seconds' in date) return new Date(date.seconds * 1000);
    return null;
  }

  getTaskDates(task: Task): { start: Date; end: Date } | null {
    const startDate = this.convertToDate(task.startDate);
    const dueDate = this.convertToDate(task.dueDate);
    if (startDate && dueDate) {
      return { start: startDate, end: dueDate };
    }
    return null;
  }

  getTaskTooltip(task: Task): string {
    const dates = this.getTaskDates(task);
    if (dates) {
      return `${task.title}\n開始: ${dates.start.toLocaleDateString()}\n期限: ${dates.end.toLocaleDateString()}`;
    }
    return task.title;
  }

  private renderGanttChart(): void {
    // ヘッダーの日付は既にテンプレートで表示されているため、
    // ここでは特に何もしません
  }

  calculatePosition(date: Date): number {
    const totalDays = (this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysFromStart = (date.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24);
    return (daysFromStart / totalDays) * 100;
  }

  calculateWidth(startDate: Date, endDate: Date): number {
    const totalDays = (this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const taskDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    return (taskDays / totalDays) * 100;
  }
} 