import { Component, OnInit } from '@angular/core';
import { ErrorAnalysisService, ErrorAnalysis } from '../../services/error-analysis.service';
import { ErrorLog } from '../../services/error-logging.service';
import { ErrorReportService } from '../../services/error-report.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-error-dashboard',
  templateUrl: './error-dashboard.component.html',
  styleUrls: ['./error-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule
  ]
})
export class ErrorDashboardComponent implements OnInit {
  errorAnalysis: ErrorAnalysis | null = null;
  loading = false;
  error: string | null = null;
  Object = Object;

  // テーブルの列定義
  displayedColumns: string[] = ['errorCode', 'count', 'lastOccurrence', 'actions'];
  recentErrorColumns: string[] = ['timestamp', 'errorCode', 'errorMessage', 'userId'];

  constructor(
    private errorAnalysisService: ErrorAnalysisService,
    private errorReportService: ErrorReportService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadErrorAnalysis();
  }

  async loadErrorAnalysis(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      this.errorAnalysis = await this.errorAnalysisService.analyzeErrors();
    } catch (error) {
      this.error = 'エラー分析の読み込みに失敗しました';
      this.snackBar.open(this.error, '閉じる', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.loading = false;
    }
  }

  async generateReport(): Promise<void> {
    if (!this.errorAnalysis) return;

    try {
      this.loading = true;
      const report = this.errorReportService.generateReport(
        this.errorAnalysis.recentErrors,
        this.errorAnalysis
      );

      // CSV形式でエクスポート
      const csvContent = this.errorReportService.exportToCSV(report);
      this.downloadCSV(csvContent, `error_report_${new Date().toISOString().split('T')[0]}.csv`);

      this.snackBar.open('エラーレポートを生成しました', '閉じる', {
        duration: 3000
      });
    } catch (error) {
      this.snackBar.open('レポートの生成に失敗しました', '閉じる', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.loading = false;
    }
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async showErrorDetails(errorCode: string): Promise<void> {
    try {
      const errorLogs = await this.errorAnalysisService.getErrorDetails(errorCode);
      // TODO: エラー詳細ダイアログの実装
      console.log('エラー詳細:', errorLogs);
    } catch (error) {
      this.snackBar.open('エラー詳細の取得に失敗しました', '閉じる', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  // エラー発生率の計算
  calculateErrorRate(count: number): string {
    if (!this.errorAnalysis) return '0%';
    return `${((count / this.errorAnalysis.totalErrors) * 100).toFixed(1)}%`;
  }

  // 日付のフォーマット
  formatDate(timestamp: any): string {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  // データの更新
  async refresh(): Promise<void> {
    await this.loadErrorAnalysis();
    this.snackBar.open('データを更新しました', '閉じる', {
      duration: 3000
    });
  }
} 