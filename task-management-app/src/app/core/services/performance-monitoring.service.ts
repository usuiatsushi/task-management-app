import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, DocumentData } from '@angular/fire/firestore';
import { ErrorHandler } from '@angular/core';
import { PerformanceMetrics } from '../models/performance-metrics.model';
import { UserBehavior } from '../models/user-behavior.model';
import { ErrorLog } from '../models/error-log.model';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitoringService {
  private readonly COLLECTION_METRICS = 'performance_metrics';
  private readonly COLLECTION_ERRORS = 'error_logs';
  private readonly COLLECTION_BEHAVIOR = 'user_behaviors';

  constructor(
    private firestore: Firestore,
    private errorHandler: ErrorHandler,
    private auth: Auth
  ) {
    this.initializePerformanceMonitoring();
  }

  private initializePerformanceMonitoring(): void {
    // パフォーマンスメトリクスの収集を開始
    this.startCollectingMetrics();
    // エラーハンドリングの設定
    this.setupErrorHandling();
    // ユーザー行動の追跡を開始
    this.startTrackingUserBehavior();
  }

  private startCollectingMetrics(): void {
    // パフォーマンスメトリクスの収集
    if (window.performance) {
      const metrics: PerformanceMetrics = {
        timestamp: new Date(),
        pageLoadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
        domContentLoadedTime: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
        firstContentfulPaint: this.getFirstContentfulPaint(),
        timeToInteractive: this.getTimeToInteractive(),
        memoryUsage: this.getMemoryUsage(),
        networkRequests: this.getNetworkRequests(),
        componentRenderTime: this.getComponentRenderTime()
      };

      this.saveMetrics(metrics);
    }
  }

  private getFirstContentfulPaint(): number {
    const entries = performance.getEntriesByType('paint');
    const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  private getTimeToInteractive(): number {
    // TTIの計算ロジックを実装
    return 0;
  }

  private getMemoryUsage(): number {
    const performanceMemory = (performance as any).memory;
    return performanceMemory ? performanceMemory.usedJSHeapSize : 0;
  }

  private getNetworkRequests(): number {
    return performance.getEntriesByType('resource').length;
  }

  private getComponentRenderTime(): number {
    // コンポーネントのレンダリング時間を計測
    return 0;
  }

  private setupErrorHandling(): void {
    // グローバルエラーハンドラーの設定
    window.onerror = (message, source, lineno, colno, error) => {
      this.logError({
        timestamp: new Date(),
        message: message.toString(),
        source: source,
        lineNumber: lineno,
        columnNumber: colno,
        error: error ? error.stack : undefined,
        severity: 'error'
      });
    };

    // Angularのエラーハンドラーをオーバーライド
    const originalHandleError = this.errorHandler.handleError;
    this.errorHandler.handleError = (error: any) => {
      this.logError({
        timestamp: new Date(),
        message: error.message,
        source: error.source,
        error: error.stack,
        severity: 'error'
      });
      originalHandleError.call(this.errorHandler, error);
    };
  }

  private startTrackingUserBehavior(): void {
    // ユーザー行動の追跡を開始
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const behavior: UserBehavior = {
        timestamp: new Date(),
        eventType: 'click',
        targetElement: target.tagName,
        targetId: target.id,
        targetClass: target.className,
        pageUrl: window.location.href
      };
      this.saveUserBehavior(behavior);
    });

    // スクロールイベントの追跡
    let scrollTimeout: any;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const behavior: UserBehavior = {
          timestamp: new Date(),
          eventType: 'scroll',
          pageUrl: window.location.href,
          scrollPosition: window.scrollY
        };
        this.saveUserBehavior(behavior);
      }, 100);
    });
  }

  private async saveMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      const metricsRef = collection(this.firestore, this.COLLECTION_METRICS);
      await addDoc(metricsRef, {
        ...metrics,
        userId: user.uid
      });
    } catch (error) {
      console.error('Failed to save performance metrics:', error);
    }
  }

  private async logError(error: ErrorLog): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      const errorsRef = collection(this.firestore, this.COLLECTION_ERRORS);
      await addDoc(errorsRef, {
        ...error,
        userId: user.uid
      });
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }

  private async saveUserBehavior(behavior: UserBehavior): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      const behaviorRef = collection(this.firestore, this.COLLECTION_BEHAVIOR);
      await addDoc(behaviorRef, {
        ...behavior,
        userId: user.uid
      });
    } catch (error) {
      console.error('Failed to save user behavior:', error);
    }
  }

  // パフォーマンスメトリクスの取得
  async getPerformanceMetrics(startDate: Date, endDate: Date): Promise<PerformanceMetrics[]> {
    try {
      const user = this.auth.currentUser;
      if (!user) return [];

      const metricsRef = collection(this.firestore, this.COLLECTION_METRICS);
      const q = query(
        metricsRef,
        where('userId', '==', user.uid),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as PerformanceMetrics);
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return [];
    }
  }

  // エラーログの取得
  async getErrorLogs(startDate: Date, endDate: Date): Promise<ErrorLog[]> {
    try {
      const user = this.auth.currentUser;
      if (!user) return [];

      const errorsRef = collection(this.firestore, this.COLLECTION_ERRORS);
      const q = query(
        errorsRef,
        where('userId', '==', user.uid),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ErrorLog);
    } catch (error) {
      console.error('Failed to get error logs:', error);
      return [];
    }
  }

  // ユーザー行動の取得
  async getUserBehavior(startDate: Date, endDate: Date): Promise<UserBehavior[]> {
    try {
      const user = this.auth.currentUser;
      if (!user) return [];

      const behaviorRef = collection(this.firestore, this.COLLECTION_BEHAVIOR);
      const q = query(
        behaviorRef,
        where('userId', '==', user.uid),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as UserBehavior);
    } catch (error) {
      console.error('Failed to get user behavior:', error);
      return [];
    }
  }
} 