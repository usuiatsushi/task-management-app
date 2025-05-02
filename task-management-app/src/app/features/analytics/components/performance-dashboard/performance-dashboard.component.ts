import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PerformanceMonitoringService } from '../../../../core/services/performance-monitoring.service';
import { PerformanceMetrics } from '../../../../core/models/performance-metrics.model';
import { ErrorLog } from '../../../../core/models/error-log.model';
import { UserBehavior } from '../../../../core/models/user-behavior.model';
import { Subject, from } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './performance-dashboard.component.html',
  styleUrls: ['./performance-dashboard.component.scss']
})
export class PerformanceDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly auth = inject(Auth);
  private readonly performanceService = inject(PerformanceMonitoringService);

  metrics: PerformanceMetrics[] = [];
  errorLogs: ErrorLog[] = [];
  userBehaviors: UserBehavior[] = [];
  loading = false;
  startDate: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7日前
  endDate: Date = new Date();

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    from(this.performanceService.getPerformanceMetrics(this.startDate, this.endDate))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metrics: PerformanceMetrics[]) => {
          this.metrics = metrics;
          this.loading = false;
        },
        error: (error: Error) => {
          console.error('Failed to load performance metrics:', error);
          this.loading = false;
        }
      });

    from(this.performanceService.getErrorLogs(this.startDate, this.endDate))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (logs: ErrorLog[]) => {
          this.errorLogs = logs;
        },
        error: (error: Error) => {
          console.error('Failed to load error logs:', error);
        }
      });

    from(this.performanceService.getUserBehavior(this.startDate, this.endDate))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (behaviors: UserBehavior[]) => {
          this.userBehaviors = behaviors;
        },
        error: (error: Error) => {
          console.error('Failed to load user behaviors:', error);
        }
      });
  }

  onDateRangeChange(): void {
    this.loadData();
  }

  get averagePageLoadTime(): number {
    return this.calculateAverage('pageLoadTime');
  }

  get averageFCP(): number {
    return this.calculateAverage('firstContentfulPaint');
  }

  get averageMemoryUsage(): number {
    return this.calculateAverage('memoryUsage');
  }

  get errorCount(): number {
    return this.errorLogs.filter(log => log.severity === 'error').length;
  }

  get warningCount(): number {
    return this.errorLogs.filter(log => log.severity === 'warning').length;
  }

  get clickEvents(): number {
    return this.userBehaviors.filter(behavior => behavior.eventType === 'click').length;
  }

  get scrollEvents(): number {
    return this.userBehaviors.filter(behavior => behavior.eventType === 'scroll').length;
  }

  calculateAverage(property: keyof PerformanceMetrics): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, metric) => acc + (metric[property] as number), 0);
    return sum / this.metrics.length;
  }

  formatTime(ms: number): string {
    return `${ms.toFixed(2)}ms`;
  }

  formatMemory(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)}MB`;
  }
} 