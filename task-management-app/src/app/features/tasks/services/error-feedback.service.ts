import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { ErrorLog } from './error-logging.service';

export interface ErrorFeedback {
  errorLog: ErrorLog;
  description: string;
  reproductionSteps: string;
  additionalInfo?: string;
  screenshot?: string;
  submittedAt: Date;
  status: 'pending' | 'reviewed' | 'resolved';
}

@Injectable({
  providedIn: 'root'
})
export class ErrorFeedbackService {
  constructor(private firestore: Firestore) {}

  async submitFeedback(feedback: Omit<ErrorFeedback, 'submittedAt' | 'status'>): Promise<void> {
    const feedbackCollection = collection(this.firestore, 'error-feedback');
    await addDoc(feedbackCollection, {
      ...feedback,
      submittedAt: new Date(),
      status: 'pending'
    });
  }
} 