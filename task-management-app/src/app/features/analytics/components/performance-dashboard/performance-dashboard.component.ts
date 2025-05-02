import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PerformanceMonitoringService } from '../../../../core/services/performance-monitoring.service';
import { PerformanceMetrics } from '../../../../core/models/performance-metrics.model';
import { ErrorLog } from '../../../../core/models/error-log.model';
import { UserBehavior } from '../../../../core/models/user-behavior.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatIconModule,
    MatExpansionModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './performance-dashboard.component.html',
  styleUrls: ['./performance-dashboard.component.scss']
})
export class PerformanceDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // パフォーマンスメトリクス
  metrics: PerformanceMetrics[] = [];
  averagePageLoadTime: number = 0;
  averageFCP: number = 0;
  averageMemoryUsage: number = 0;
  
  // エラーログ
  errorLogs: ErrorLog[] = [];
  errorCount: number = 0;
  warningCount: number = 0;
  
  // ユーザー行動
  userBehaviors: UserBehavior[] = [];
  clickEvents: number = 0;
  scrollEvents: number = 0;
  
  // 日付範囲
  startDate: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7日前
  endDate: Date = new Date();
  
  // ローディング状態
  isLoading: boolean = false;
  
  constructor(private performanceService: PerformanceMonitoringService) {}
  
  ngOnInit(): void {
    this.loadData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      // パフォーマンスメトリクスの取得
      this.metrics = await this.performanceService.getPerformanceMetrics(this.startDate, this.endDate);
      this.calculateMetricsAverages();
      
      // エラーログの取得
      this.errorLogs = await this.performanceService.getErrorLogs(this.startDate, this.endDate);
      this.calculateErrorCounts();
      
      // ユーザー行動の取得
      this.userBehaviors = await this.performanceService.getUserBehavior(this.startDate, this.endDate);
      this.calculateUserBehavior();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  private calculateMetricsAverages(): void {
    if (this.metrics.length > 0) {
      this.averagePageLoadTime = this.metrics.reduce((sum, metric) => sum + metric.pageLoadTime, 0) / this.metrics.length;
      this.averageFCP = this.metrics.reduce((sum, metric) => sum + metric.firstContentfulPaint, 0) / this.metrics.length;
      this.averageMemoryUsage = this.metrics.reduce((sum, metric) => sum + metric.memoryUsage, 0) / this.metrics.length;
    }
  }
  
  private calculateErrorCounts(): void {
    this.errorCount = this.errorLogs.filter(log => log.severity === 'error').length;
    this.warningCount = this.errorLogs.filter(log => log.severity === 'warning').length;
  }
  
  private calculateUserBehavior(): void {
    this.clickEvents = this.userBehaviors.filter(behavior => behavior.eventType === 'click').length;
    this.scrollEvents = this.userBehaviors.filter(behavior => behavior.eventType === 'scroll').length;
  }
  
  onDateRangeChange(): void {
    this.loadData();
  }
  
  formatTime(ms: number): string {
    return `${(ms / 1000).toFixed(2)}秒`;
  }
  
  formatMemory(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)}MB`;
  }
} 