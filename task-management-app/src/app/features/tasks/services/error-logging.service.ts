import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, Timestamp } from '@angular/fire/firestore';
import { AIAssistantError } from '../models/ai-assistant.error';

export interface ErrorLog {
  timestamp: Timestamp;
  errorCode: string;
  errorName: string;
  errorMessage: string;
  errorStack?: string;
  errorDetails?: any;
  userId?: string;
  browserInfo: {
    userAgent: string;
    platform: string;
    language: string;
  };
  environment: {
    online: boolean;
    url: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ErrorLoggingService {
  private readonly COLLECTION_NAME = 'error_logs';

  constructor(private firestore: Firestore) {}

  async logError(error: any, userId?: string): Promise<void> {
    try {
      const errorLog: ErrorLog = {
        timestamp: Timestamp.now(),
        errorCode: error instanceof AIAssistantError ? error.code : 'UNKNOWN',
        errorName: error.name || 'UnknownError',
        errorMessage: error.message || 'Unknown error occurred',
        errorStack: error.stack,
        errorDetails: error.details,
        userId,
        browserInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        },
        environment: {
          online: navigator.onLine,
          url: window.location.href
        }
      };

      const errorLogsRef = collection(this.firestore, this.COLLECTION_NAME);
      await addDoc(errorLogsRef, errorLog);
    } catch (loggingError) {
      console.error('エラーログの保存に失敗しました:', loggingError);
    }
  }

  async logErrorWithRetry(error: any, userId?: string, maxRetries = 3): Promise<void> {
    let retryCount = 0;
    while (retryCount < maxRetries) {
      try {
        await this.logError(error, userId);
        return;
      } catch (loggingError) {
        retryCount++;
        if (retryCount === maxRetries) {
          console.error('エラーログの保存に失敗しました（最大リトライ回数に達しました）:', loggingError);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
  }
} 