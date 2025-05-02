import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ERROR_MESSAGES } from '../constants/error-messages';
import { AIAssistantError, FirestoreError } from '../models/ai-assistant.error';
import { Observable, throwError } from 'rxjs';
import { retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandler {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1秒

  constructor(private snackBar: MatSnackBar) {}

  // エラーの処理とユーザーへの通知
  handleError(error: any): void {
    console.error('エラーが発生しました:', error);

    let errorMessage = this.getErrorMessage(error);
    this.showErrorNotification(errorMessage);

    // エラーログの送信やモニタリング（必要に応じて実装）
    this.logError(error);
  }

  // エラーメッセージの取得
  private getErrorMessage(error: any): string {
    if (error instanceof AIAssistantError) {
      return error.message;
    }

    if (error instanceof FirestoreError) {
      return ERROR_MESSAGES.FIRESTORE.QUERY_FAILED;
    }

    if (error.code === 'PERMISSION_DENIED') {
      return ERROR_MESSAGES.FIRESTORE.PERMISSION_DENIED;
    }

    if (error.name === 'TimeoutError') {
      return ERROR_MESSAGES.SYSTEM.TIMEOUT_ERROR;
    }

    if (!navigator.onLine) {
      return ERROR_MESSAGES.SYSTEM.NETWORK_ERROR;
    }

    return ERROR_MESSAGES.SYSTEM.UNEXPECTED_ERROR;
  }

  // エラー通知の表示
  private showErrorNotification(message: string): void {
    this.snackBar.open(message, '閉じる', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // エラーログの記録
  private logError(error: any): void {
    // TODO: エラーログの送信やモニタリングの実装
    console.error('エラーログ:', {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      }
    });
  }

  // リトライ可能な操作のラッパー
  retryOperation<T>(operation: () => Observable<T>): Observable<T> {
    return operation().pipe(
      retry({
        count: this.MAX_RETRIES,
        delay: this.RETRY_DELAY,
        resetOnSuccess: true
      })
    );
  }

  // エラーをObservableとして返す
  asObservableError(error: any): Observable<never> {
    return throwError(() => error);
  }
} 