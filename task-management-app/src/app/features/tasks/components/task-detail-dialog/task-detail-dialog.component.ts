import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Task } from '../../models/task.model';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './task-detail-dialog.component.html',
  styleUrl: './task-detail-dialog.component.css'
})
export class TaskDetailDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { task: Task }) {}

  get task() {
    return this.data.task;
  }

  get dueDate(): Date | null {
    const due = this.task.dueDate;
    if (!due) return null;
    // Firestore Timestamp
    if (typeof due === 'object' && 'toDate' in due && typeof due.toDate === 'function') {
      return due.toDate();
    }
    // { seconds, nanoseconds } 形式
    if (typeof due === 'object' && 'seconds' in due && 'nanoseconds' in due) {
      return new Date(due.seconds * 1000);
    }
    // string or Date
    return new Date(due);
  }

  editTask() {
    // TODO: 編集処理
    alert('編集機能は未実装です');
  }

  toggleComplete() {
    // TODO: 完了/未完了トグル処理
    alert('完了/未完了トグルは未実装です');
  }

  deleteTask() {
    // TODO: 削除処理
    alert('削除機能は未実装です');
  }
}
