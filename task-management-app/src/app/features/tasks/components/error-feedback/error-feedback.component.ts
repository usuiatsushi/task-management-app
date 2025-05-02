import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ErrorLog } from '../../services/error-logging.service';
import { ErrorFeedbackService } from '../../services/error-feedback.service';
import * as html2canvas from 'html2canvas';

export interface ErrorFeedbackData {
  errorLog: ErrorLog;
  screenshot?: string;
}

@Component({
  selector: 'app-error-feedback',
  templateUrl: './error-feedback.component.html',
  styleUrls: ['./error-feedback.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  providers: [ErrorFeedbackService]
})
export class ErrorFeedbackComponent {
  feedbackForm: FormGroup;
  screenshot: string | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ErrorFeedbackComponent>,
    @Inject(ErrorFeedbackService) private feedbackService: ErrorFeedbackService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: ErrorFeedbackData
  ) {
    this.feedbackForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(10)]],
      reproductionSteps: ['', [Validators.required, Validators.minLength(20)]],
      additionalInfo: ['']
    });

    if (data.screenshot) {
      this.screenshot = data.screenshot;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.feedbackForm.invalid) return;

    try {
      this.isSubmitting = true;
      await this.feedbackService.submitFeedback({
        errorLog: this.data.errorLog,
        description: this.feedbackForm.value.description,
        reproductionSteps: this.feedbackForm.value.reproductionSteps,
        additionalInfo: this.feedbackForm.value.additionalInfo,
        screenshot: this.screenshot
      });

      this.snackBar.open('フィードバックを送信しました', '閉じる', {
        duration: 3000
      });
      this.dialogRef.close();
    } catch (error) {
      this.snackBar.open('フィードバックの送信に失敗しました', '閉じる', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  async captureScreenshot(): Promise<void> {
    try {
      const canvas = await html2canvas.default(document.body);
      this.screenshot = canvas.toDataURL('image/png');
    } catch (error) {
      this.snackBar.open('スクリーンショットの取得に失敗しました', '閉じる', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }
} 