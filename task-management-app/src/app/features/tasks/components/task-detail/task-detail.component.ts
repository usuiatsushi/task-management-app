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
import { TimestampPipe } from '../../pipes/timestamp.pipe';

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
    TimestampPipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TaskDetailComponent implements OnInit {
  task: Task | null = null;
  taskId: string | null = null;
  loading = false;
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

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.taskId = id;
        this.loadTask(id);
      }
    });
  }

  private async loadTask(taskId: string) {
    this.loading = true;
    try {
      const task = await this.taskService.getTask(taskId);
      if (task) {
        this.task = {
          ...task,
          dueDate: this.convertToDate(task.dueDate),
          createdAt: this.convertToDate(task.createdAt),
          updatedAt: this.convertToDate(task.updatedAt)
        };
      }
    } catch (error) {
      console.error('タスクの読み込みに失敗しました:', error);
    } finally {
      this.loading = false;
    }
  }

  private convertToDate(date: any): Timestamp {
    if (date instanceof Timestamp) return date;
    if (date?.toDate) return Timestamp.fromDate(date.toDate());
    if (date?.seconds) return Timestamp.fromMillis(date.seconds * 1000);
    return Timestamp.fromDate(new Date());
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
} 