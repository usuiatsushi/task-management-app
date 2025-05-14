import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Firestore, doc, getDoc, deleteDoc } from '@angular/fire/firestore';
import { TaskService } from '../../services/task.service';
import { Task, SubTask } from '../../models/task.model';
import { Timestamp } from 'firebase/firestore';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { interval } from 'rxjs';
import { CommentSectionComponent } from '../comment-section/comment-section.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

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
    MatSnackBarModule,
    MatSliderModule,
    FormsModule,
    ReactiveFormsModule,
    CommentSectionComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TaskDetailComponent implements OnInit {
  task: Task | null = null;
  loading = true;
  deleting = false;
  progressControl = new FormControl(0);
  newSubTaskTitle = '';
  newSubTaskAssignee = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private taskService: TaskService
  ) { }

  async ngOnInit() {
    const taskId = this.route.snapshot.paramMap.get('id');
    if (taskId) {
      await this.loadTask(taskId);
      if (this.task) {
        // 進捗状況の変更を監視
        this.progressControl.valueChanges.subscribe(value => {
          if (this.task) {
            this.task.progress = value ?? 0;
            this.onProgressChange(this.task);
          }
        });
      }
    }
    this.loading = false;
    this.checkDeadlineReminder();
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

      // 進捗状況が未設定の場合、ステータスに基づいて設定
      if (task.progress === undefined || task.progress === null) {
        switch (task.status) {
          case '未着手':
            task.progress = 0;
            break;
          case '進行中':
            task.progress = 50;
            break;
          case '完了':
            task.progress = 100;
            break;
          default:
            task.progress = 0;
        }
      }
      
      this.task = task;
      // 進捗状況コントロールの値を更新
      this.progressControl.setValue(task.progress);
    }
  }

  private convertTimestampToDate(timestamp: Timestamp | { seconds: number; nanoseconds: number } | Date | string | null): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
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
    if (!this.task) return 0;
    
    // タスクの進捗状況が設定されている場合はその値を使用
    if (this.task.progress !== undefined && this.task.progress !== null) {
      return this.task.progress;
    }

    // 進捗状況が設定されていない場合は、ステータスに基づいてデフォルト値を設定
    switch (this.task.status) {
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

  onProgressChange(task: Task) {
    // 進捗率を保存（APIやFirestoreに反映）
    this.taskService.updateTask(task.id, { progress: task.progress });
  }

  onSliderChange(event: any, task: Task) {
    task.progress = event;
    this.onProgressChange(task);
  }

  addSubTask() {
    if (!this.task) return;
    const sub: SubTask = {
      id: crypto.randomUUID(),
      title: this.newSubTaskTitle,
      assignee: this.newSubTaskAssignee,
      done: false
    };
    this.task.subTasks = this.task.subTasks || [];
    this.task.subTasks.push(sub);
    this.newSubTaskTitle = '';
    this.newSubTaskAssignee = '';
    this.saveTask();
  }

  removeSubTask(sub: SubTask) {
    if (!this.task) return;
    this.task.subTasks = this.task.subTasks?.filter(s => s.id !== sub.id);
    this.saveTask();
  }

  updateSubTask(sub: SubTask) {
    this.saveTask();
  }

  saveTask() {
    if (this.task) {
      this.taskService.updateTask(this.task.id, { subTasks: this.task.subTasks });
    }
  }

  checkDeadlineReminder() {
    if (!this.task?.dueDate) return;
    let due: Date;
    if (this.task.dueDate instanceof Date) {
      due = this.task.dueDate;
    } else if (this.task.dueDate instanceof Timestamp) {
      due = this.task.dueDate.toDate();
    } else if (typeof this.task.dueDate === 'object' && 'toDate' in this.task.dueDate && typeof this.task.dueDate.toDate === 'function') {
      due = this.task.dueDate.toDate();
    } else if (typeof this.task.dueDate === 'object' && 'seconds' in this.task.dueDate && 'nanoseconds' in this.task.dueDate) {
      due = new Date(this.task.dueDate.seconds * 1000 + this.task.dueDate.nanoseconds / 1000000);
    } else if (typeof this.task.dueDate === 'string') {
      due = new Date(this.task.dueDate);
    } else {
      console.warn('Invalid dueDate format:', this.task.dueDate);
      return;
    }
    const now = new Date();
    // 日付部分だけで差分日数を計算
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.ceil((startOfDue.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 7) { // 1週間以内なら通知
      let message = '';
      if (diffDays === 0) {
        message = '締め切りは本日です！';
      } else {
        message = `締め切りまであと${diffDays}日です`;
      }
      this.snackBar.open(message, '閉じる', {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'bottom'
      });
    }
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'todo': '未着手',
      'in_progress': '進行中',
      'done': '完了'
    };
    return statusMap[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'high': '高',
      'medium': '中',
      'low': '低'
    };
    return priorityMap[priority] || priority;
  }

  editTask() {
    if (this.task) {
      this.router.navigate(['/tasks', this.task.id, 'edit']);
    }
  }

  getFormattedDate(date: any): string {
    if (!date) return '未設定';
    if (date instanceof Date) return date.toLocaleDateString('ja-JP');
    if (date instanceof Timestamp) return date.toDate().toLocaleDateString('ja-JP');
    if (typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
      return new Date(date.seconds * 1000 + date.nanoseconds / 1000000).toLocaleDateString('ja-JP');
    }
    if (typeof date === 'string') return new Date(date).toLocaleDateString('ja-JP');
    return '未設定';
  }

  async updateTaskStatus(status: '未着手' | '進行中' | '完了'): Promise<void> {
    if (!this.task) {
      this.snackBar.open('タスクが見つかりません', '閉じる', { duration: 3000 });
      return;
    }

    try {
      const updates: Partial<Task> = {
        status,
        updatedAt: Timestamp.now()
      };

      // 進行中に変更する場合、進捗状況を50%に設定
      if (status === '進行中' && this.task.status !== '進行中') {
        updates.progress = 50;
        this.progressControl.setValue(50);
      }

      // 完了に変更する場合、進捗状況を100%に設定
      if (status === '完了') {
        updates.progress = 100;
        updates.completedAt = Timestamp.now();
        this.progressControl.setValue(100);
      }

      await this.taskService.updateTask(this.task.id, updates);
      this.snackBar.open('タスクのステータスを更新しました', '閉じる', { duration: 3000 });
    } catch (error) {
      console.error('タスクのステータス更新に失敗しました:', error);
      this.snackBar.open('タスクのステータス更新に失敗しました', '閉じる', { duration: 3000 });
    }
  }
} 