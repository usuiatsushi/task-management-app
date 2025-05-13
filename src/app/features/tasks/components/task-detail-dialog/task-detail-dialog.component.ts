import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Task } from '../../models/task.model';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  constructor(
    public dialogRef: MatDialogRef<TaskDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { task: Task },
    private router: Router,
    private taskService: TaskService,
    private snackBar: MatSnackBar
  ) {}

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
    this.dialogRef.close();
    setTimeout(() => {
      this.router.navigate(['/tasks', this.task.id, 'edit']);
    }, 100); // ダイアログが閉じてから遷移
  }

  async toggleComplete() {
    const newStatus = this.task.status === '完了' ? '未着手' : '完了';
    try {
      await this.taskService.updateTask(this.task.id, { status: newStatus });
      this.snackBar.open(
        newStatus === '完了' ? 'タスクを完了にしました' : 'タスクを未完了に戻しました',
        '閉じる',
        { duration: 3000 }
      );
      this.dialogRef.close();
    } catch (error) {
      this.snackBar.open('ステータス更新に失敗しました', '閉じる', { duration: 3000 });
    }
  }

  async deleteTask() {
    if (!confirm('本当にこのタスクを削除しますか？')) return;
    try {
      await this.taskService.deleteTask(this.task.id);
      this.snackBar.open('タスクを削除しました', '閉じる', { duration: 3000 });
      this.dialogRef.close();
    } catch (error) {
      this.snackBar.open('タスクの削除に失敗しました', '閉じる', { duration: 3000 });
    }
  }
}
