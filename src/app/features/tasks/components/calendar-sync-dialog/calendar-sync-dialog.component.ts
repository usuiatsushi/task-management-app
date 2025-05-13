import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calendar-sync-dialog',
  template: `
    <h2 mat-dialog-title>カレンダー連携の確認</h2>
    <mat-dialog-content>
      <p>タスク「{{ data.taskTitle }}」をGoogleカレンダーに連携しますか？</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">いいえ</button>
      <button mat-raised-button color="primary" (click)="onYesClick()">はい</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule]
})
export class CalendarSyncDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CalendarSyncDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { taskTitle: string }
  ) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
} 