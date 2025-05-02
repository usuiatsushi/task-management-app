import { Injectable } from '@angular/core';
import { ErrorLog } from './error-logging.service';
import { ErrorAnalysis } from './error-analysis.service';
import { Timestamp } from '@angular/fire/firestore';

export interface ErrorReport {
  id: string;
  generatedAt: Timestamp;
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  summary: {
    totalErrors: number;
    errorTypes: {
      [key: string]: number;
    };
    mostAffectedUsers: {
      userId: string;
      errorCount: number;
    }[];
  };
  details: {
    criticalErrors: ErrorLog[];
    recentErrors: ErrorLog[];
    errorTrends: {
      date: string;
      count: number;
    }[];
  };
  recommendations: {
    immediateActions: string[];
    longTermSolutions: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ErrorReportService {
  constructor() {}

  generateReport(errorLogs: ErrorLog[], errorAnalysis: ErrorAnalysis): ErrorReport {
    const now = Timestamp.now();
    const thirtyDaysAgo = new Timestamp(
      now.seconds - (30 * 24 * 60 * 60),
      now.nanoseconds
    );

    // クリティカルエラーの特定（例：同じエラーが複数回発生しているもの）
    const criticalErrors = this.identifyCriticalErrors(errorLogs);

    // 推奨事項の生成
    const recommendations = this.generateRecommendations(errorAnalysis, criticalErrors);

    return {
      id: `report_${now.seconds}`,
      generatedAt: now,
      period: {
        start: thirtyDaysAgo,
        end: now
      },
      summary: {
        totalErrors: errorAnalysis.totalErrors,
        errorTypes: errorAnalysis.errorTypes,
        mostAffectedUsers: errorAnalysis.userImpact
          .sort((a, b) => b.errorCount - a.errorCount)
          .slice(0, 5)
      },
      details: {
        criticalErrors,
        recentErrors: errorAnalysis.recentErrors,
        errorTrends: errorAnalysis.errorTrends
      },
      recommendations
    };
  }

  private identifyCriticalErrors(errorLogs: ErrorLog[]): ErrorLog[] {
    const errorCounts = new Map<string, number>();
    const errorMap = new Map<string, ErrorLog>();

    errorLogs.forEach(log => {
      const key = `${log.errorCode}_${log.errorMessage}`;
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
      errorMap.set(key, log);
    });

    return Array.from(errorCounts.entries())
      .filter(([_, count]) => count >= 3) // 3回以上発生したエラーをクリティカルとみなす
      .map(([key]) => errorMap.get(key)!);
  }

  private generateRecommendations(
    errorAnalysis: ErrorAnalysis,
    criticalErrors: ErrorLog[]
  ): { immediateActions: string[]; longTermSolutions: string[] } {
    const immediateActions: string[] = [];
    const longTermSolutions: string[] = [];

    // クリティカルエラーに対する即時対応
    criticalErrors.forEach(error => {
      immediateActions.push(
        `エラーコード ${error.errorCode} の調査と修正を優先してください。`
      );
    });

    // エラーの傾向に基づく長期的な解決策
    if (errorAnalysis.errorTypes['NETWORK_ERROR'] > 0) {
      longTermSolutions.push('ネットワーク接続の安定性を向上させるための対策を検討してください。');
    }

    if (errorAnalysis.errorTypes['VALIDATION_ERROR'] > 0) {
      longTermSolutions.push('入力バリデーションの強化とユーザーガイダンスの改善を検討してください。');
    }

    return {
      immediateActions,
      longTermSolutions
    };
  }

  exportToCSV(report: ErrorReport): string {
    const rows: string[] = [];
    
    // ヘッダー
    rows.push('エラーレポート');
    rows.push(`生成日時: ${report.generatedAt.toDate().toLocaleString('ja-JP')}`);
    rows.push(`期間: ${report.period.start.toDate().toLocaleString('ja-JP')} から ${report.period.end.toDate().toLocaleString('ja-JP')}`);
    rows.push('');
    
    // サマリー
    rows.push('サマリー');
    rows.push(`総エラー数: ${report.summary.totalErrors}`);
    rows.push('エラータイプ別発生回数:');
    Object.entries(report.summary.errorTypes).forEach(([type, count]) => {
      rows.push(`${type}: ${count}`);
    });
    rows.push('');
    
    // 推奨事項
    rows.push('即時対応が必要な項目:');
    report.recommendations.immediateActions.forEach(action => {
      rows.push(action);
    });
    rows.push('');
    
    rows.push('長期的な解決策:');
    report.recommendations.longTermSolutions.forEach(solution => {
      rows.push(solution);
    });
    
    return rows.join('\n');
  }
} 