import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-timeline-controls',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="timeline-controls">
      <button mat-icon-button (click)="onPreviousMonth()" matTooltip="前月">
        <mat-icon>keyboard_double_arrow_left</mat-icon>
        <span class="label">前月</span>
      </button>
      <button mat-icon-button (click)="onPreviousWeek()" matTooltip="前週">
        <mat-icon>chevron_left</mat-icon>
        <span class="label">前週</span>
      </button>
      <button mat-icon-button (click)="onPreviousDay()" matTooltip="前日">
        <mat-icon>navigate_before</mat-icon>
        <span class="label">前日</span>
      </button>
      <button mat-icon-button (click)="onThisMonth()" matTooltip="今月">
        <mat-icon>calendar_today</mat-icon>
        <span class="label">今月</span>
      </button>
      <button mat-icon-button (click)="onNextDay()" matTooltip="次日">
        <mat-icon>navigate_next</mat-icon>
        <span class="label">次日</span>
      </button>
      <button mat-icon-button (click)="onNextWeek()" matTooltip="次週">
        <mat-icon>chevron_right</mat-icon>
        <span class="label">次週</span>
      </button>
      <button mat-icon-button (click)="onNextMonth()" matTooltip="次月">
        <mat-icon>keyboard_double_arrow_right</mat-icon>
        <span class="label">次月</span>
      </button>
    </div>
  `,
  styles: [`
    .timeline-controls {
      display: flex;
      gap: 8px;
      padding: 8px;
      align-items: flex-end;
      justify-content: center;
    }
    .timeline-controls button {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 48px;
      height: 56px;
      justify-content: flex-start;
      position: relative;
    }
    .timeline-controls .label {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
      line-height: 1;
      letter-spacing: 0.5px;
      user-select: none;
      position: absolute;
      bottom: 2px;
      left: 0;
      right: 0;
      text-align: center;
    }
  `]
})
export class TimelineControlsComponent {
  @Output() dateRangeChange = new EventEmitter<{ start: Date; end: Date }>();

  private currentStart: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  private currentEnd: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  onPreviousMonth(): void {
    const start = new Date(this.currentStart.getFullYear(), this.currentStart.getMonth() - 1, 1);
    const end = new Date(this.currentStart.getFullYear(), this.currentStart.getMonth(), 0);
    this.currentStart = start;
    this.currentEnd = end;
    this.dateRangeChange.emit({ start, end });
  }

  onPreviousWeek(): void {
    const start = new Date(this.currentStart);
    const end = new Date(this.currentEnd);
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() - 7);
    this.currentStart = start;
    this.currentEnd = end;
    this.dateRangeChange.emit({ start, end });
  }

  onPreviousDay(): void {
    const start = new Date(this.currentStart);
    const end = new Date(this.currentEnd);
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
    this.currentStart = start;
    this.currentEnd = end;
    this.dateRangeChange.emit({ start, end });
  }

  onThisMonth(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.currentStart = start;
    this.currentEnd = end;
    this.dateRangeChange.emit({ start, end });
  }

  onNextDay(): void {
    const start = new Date(this.currentStart);
    const end = new Date(this.currentEnd);
    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 1);
    this.currentStart = start;
    this.currentEnd = end;
    this.dateRangeChange.emit({ start, end });
  }

  onNextWeek(): void {
    const start = new Date(this.currentStart);
    const end = new Date(this.currentEnd);
    start.setDate(start.getDate() + 7);
    end.setDate(end.getDate() + 7);
    this.currentStart = start;
    this.currentEnd = end;
    this.dateRangeChange.emit({ start, end });
  }

  onNextMonth(): void {
    const start = new Date(this.currentStart.getFullYear(), this.currentStart.getMonth() + 1, 1);
    const end = new Date(this.currentStart.getFullYear(), this.currentStart.getMonth() + 2, 0);
    this.currentStart = start;
    this.currentEnd = end;
    this.dateRangeChange.emit({ start, end });
  }
} 