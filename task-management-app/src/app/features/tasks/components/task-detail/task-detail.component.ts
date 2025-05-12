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
  task: (Task & { dueDate: Date; createdAt: Date; updatedAt: Date }) | null = null;
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
        this.progressControl.setValue(this.task.progress ?? 0);
        this.progressControl.valueChanges.subscribe(value => {
          this.task!.progress = value ?? 0;
          this.onProgressChange(this.task!);
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
    } else if ((this.task.dueDate as any).toDate) {
      due = (this.task.dueDate as any).toDate();
    } else {
      due = new Date(this.task.dueDate);
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
} 