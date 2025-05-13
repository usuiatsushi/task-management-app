import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Firestore, doc, getDoc, deleteDoc } from '@angular/fire/firestore';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import { Timestamp } from 'firebase/firestore';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    RouterModule,
    MatDialogModule,
    MatSnackBarModule
  ]
})
export class TaskDetailComponent implements OnInit {
  task: (Task & { dueDate: Date; createdAt: Date; updatedAt: Date }) | null = null;
  loading = true;
  deleting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  async ngOnInit() {
    const taskId = this.route.snapshot.paramMap.get('id');
    if (taskId) {
      await this.loadTask(taskId);
    }
    this.loading = false;
  }

  private async loadTask(taskId: string) {
    const taskRef = doc(this.firestore, 'tasks', taskId);
    const taskDoc = await getDoc(taskRef);
    
    if (taskDoc.exists()) {
      const data = taskDoc.data();
      const task = {
        id: taskDoc.id,
        ...data,
        dueDate: this.convertTimestampToDate(data['dueDate']),
        createdAt: this.convertTimestampToDate(data['createdAt']),
        updatedAt: this.convertTimestampToDate(data['updatedAt'])
      } as Task & { dueDate: Date; createdAt: Date; updatedAt: Date };
      
      // 日付が正しく変換されていることを確認
      if (!(task.dueDate instanceof Date)) {
        console.warn('Invalid dueDate for task:', task.id, task.dueDate);
      }
      
      this.task = task;
    }
  }

  private convertTimestampToDate(timestamp: any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
      return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    console.warn('Invalid timestamp format:', timestamp);
    return new Date();
  }

  async deleteTask() {
    if (!this.task?.id) return;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'タスクの削除',
        message: `「${this.task.title}」を削除してもよろしいですか？`,
        confirmText: '削除',
        cancelText: 'キャンセル'
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        this.deleting = true;
        try {
          const taskRef = doc(this.firestore, 'tasks', this.task!.id);
          await deleteDoc(taskRef);
          this.snackBar.open('タスクを削除しました', '閉じる', { duration: 3000 });
          this.router.navigate(['/tasks']);
        } catch (error) {
          console.error('Error deleting task:', error);
          this.snackBar.open('タスクの削除に失敗しました', '閉じる', { duration: 3000 });
        } finally {
          this.deleting = false;
        }
      }
    });
  }

  getProgressPercentage(): number {
    switch (this.task?.status) {
      case '未着手':
        return 0;
      case '進行中':
        return 50;
      case '完了':
        return 100;
      default:
        return 0;
    }
  }

  getProgressColor(): string {
    const percentage = this.getProgressPercentage();
    if (percentage === 0) {
      return 'warn';
    } else if (percentage === 50) {
      return 'accent';
    } else {
      return 'primary';
    }
  }
} 