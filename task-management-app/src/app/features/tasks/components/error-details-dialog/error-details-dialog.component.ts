import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ErrorLog } from '../../services/error-logging.service';
import { ErrorAnalysisService } from '../../services/error-analysis.service';

export interface ErrorDetailsData {
  errorCode: string;
}

@Component({
  selector: 'app-error-details-dialog',
  templateUrl: './error-details-dialog.component.html',
  styleUrls: ['./error-details-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class ErrorDetailsDialogComponent implements OnInit {
  errorLogs: ErrorLog[] = [];
  displayedColumns: string[] = ['timestamp', 'message', 'userId', 'stackTrace'];
  loading = false;
  error: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<ErrorDetailsDialogComponent>,
    private errorAnalysisService: ErrorAnalysisService,
    @Inject(MAT_DIALOG_DATA) public data: ErrorDetailsData
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadErrorDetails();
  }

  private async loadErrorDetails(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      this.errorLogs = await this.errorAnalysisService.getErrorDetails(this.data.errorCode);
      this.errorLogs.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
    } catch (error) {
      this.error = 'エラー詳細の読み込みに失敗しました';
      console.error('エラー詳細の読み込みに失敗しました:', error);
    } finally {
      this.loading = false;
    }
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  onClose(): void {
    this.dialogRef.close();
  }
} 