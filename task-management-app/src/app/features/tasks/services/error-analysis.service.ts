import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, Timestamp } from '@angular/fire/firestore';
import { ErrorLog } from './error-logging.service';

export interface ErrorAnalysis {
  totalErrors: number;
  errorTypes: {
    [key: string]: number;
  };
  recentErrors: ErrorLog[];
  errorTrends: {
    date: string;
    count: number;
  }[];
  mostCommonErrors: {
    errorCode: string;
    count: number;
    lastOccurrence: Timestamp;
  }[];
  userImpact: {
    userId: string;
    errorCount: number;
  }[];
  hourlyErrors: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ErrorAnalysisService {
  private readonly COLLECTION_NAME = 'error_logs';
  private readonly ANALYSIS_PERIOD_DAYS = 30;

  constructor(private firestore: Firestore) {}

  async analyzeErrors(startDate: Date = new Date(new Date().setDate(new Date().getDate() - 30)), endDate: Date = new Date()): Promise<ErrorAnalysis> {
    try {
      const errorLogsRef = collection(this.firestore, this.COLLECTION_NAME);
      const q = query(
        errorLogsRef,
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate))
      );

      const querySnapshot = await getDocs(q);
      const errorLogs: ErrorLog[] = [];
      const errorTypes: { [key: string]: number } = {};
      const userErrors: { [key: string]: number } = {};
      const hourlyErrors = new Array(24).fill(0);

      querySnapshot.forEach(doc => {
        const errorLog = doc.data() as ErrorLog;
        errorLogs.push(errorLog);

        // エラータイプの集計
        errorTypes[errorLog.errorCode] = (errorTypes[errorLog.errorCode] || 0) + 1;

        // ユーザーごとのエラー集計
        if (errorLog.userId) {
          userErrors[errorLog.userId] = (userErrors[errorLog.userId] || 0) + 1;
        }

        // 時間帯別のエラー集計
        const hour = errorLog.timestamp.toDate().getHours();
        hourlyErrors[hour]++;
      });

      // 日付ごとのエラー傾向を計算
      const errorTrends = this.calculateErrorTrends(errorLogs);

      // 最も頻繁に発生するエラーを特定
      const mostCommonErrors = Object.entries(errorTypes)
        .map(([errorCode, count]) => ({
          errorCode,
          count,
          lastOccurrence: errorLogs
            .filter(log => log.errorCode === errorCode)
            .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)[0]?.timestamp
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // ユーザー影響度の計算
      const userImpact = Object.entries(userErrors)
        .map(([userId, errorCount]) => ({ userId, errorCount }))
        .sort((a, b) => b.errorCount - a.errorCount);

      return {
        totalErrors: errorLogs.length,
        errorTypes,
        recentErrors: errorLogs.slice(-10), // 直近10件のエラー
        errorTrends,
        mostCommonErrors,
        userImpact,
        hourlyErrors
      };
    } catch (error) {
      console.error('エラー分析に失敗しました:', error);
      throw error;
    }
  }

  private calculateErrorTrends(errorLogs: ErrorLog[]): { date: string; count: number }[] {
    const trends: { [key: string]: number } = {};
    
    errorLogs.forEach(log => {
      const date = log.timestamp.toDate().toISOString().split('T')[0];
      trends[date] = (trends[date] || 0) + 1;
    });

    return Object.entries(trends)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getErrorDetails(errorCode: string): Promise<ErrorLog[]> {
    try {
      const errorLogsRef = collection(this.firestore, this.COLLECTION_NAME);
      const q = query(
        errorLogsRef,
        where('errorCode', '==', errorCode)
      );

      const querySnapshot = await getDocs(q);
      const errorLogs: ErrorLog[] = [];

      querySnapshot.forEach(doc => {
        errorLogs.push(doc.data() as ErrorLog);
      });

      return errorLogs;
    } catch (error) {
      console.error('エラー詳細の取得に失敗しました:', error);
      throw error;
    }
  }
} 