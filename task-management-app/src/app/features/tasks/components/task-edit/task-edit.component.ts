import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Task } from '../../models/task.model';
import { CommonModule } from '@angular/common';
import { CalendarService } from '../../services/calendar.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CalendarSyncDialogComponent } from '../calendar-sync-dialog/calendar-sync-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-task-edit',
  templateUrl: './task-edit.component.html',
  styleUrls: ['./task-edit.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSnackBarModule,
    MatCheckboxModule
  ]
})
export class TaskEditComponent implements OnInit {
  taskForm: FormGroup;
  task: Task | null = null;
  loading = true;
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private firestore: Firestore,
    private calendarService: CalendarService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      status: ['未着手', Validators.required],
      priority: ['中', Validators.required],
      dueDate: [new Date(), Validators.required],
      assignedTo: ['', Validators.required],
      urgent: [false]
    });
  }

  ngOnInit() {
    this.loadTask();
    // 期限が3日以内ならurgent=true
    this.taskForm.get('dueDate')?.valueChanges.subscribe(date => {
      if (!date) return;
      const due = new Date(date);
      const now = new Date();
      const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 3) {
        this.taskForm.get('urgent')?.setValue(true, { emitEvent: false });
      }
    });
  }

  private async loadTask() {
    try {
      this.loading = true;
      const taskId = this.route.snapshot.paramMap.get('id');
      if (!taskId) {
        throw new Error('タスクIDが指定されていません');
      }

      const taskRef = doc(this.firestore, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (taskDoc.exists()) {
        this.task = taskDoc.data() as Task;
        const dueDate = this.task.dueDate;
        let formattedDueDate: Date;
        
        if (dueDate instanceof Date) {
          formattedDueDate = dueDate;
        } else if (dueDate && typeof dueDate === 'object' && 'seconds' in dueDate) {
          formattedDueDate = new Date(dueDate.seconds * 1000);
        } else if (typeof dueDate === 'string') {
          formattedDueDate = new Date(dueDate);
        } else {
          formattedDueDate = new Date();
        }

        this.taskForm.patchValue({
          ...this.task,
          dueDate: formattedDueDate,
          urgent: this.task.urgent ?? false
        });
      } else {
        throw new Error('タスクが見つかりません');
      }
    } catch (error) {
      console.error('タスクの読み込みに失敗しました:', error);
      this.snackBar.open('タスクの読み込みに失敗しました', '閉じる', { duration: 3000 });
      this.router.navigate(['/tasks']);
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    if (this.taskForm.invalid || !this.task?.id) return;

    try {
      this.saving = true;

      // カレンダー連携の確認ダイアログを表示
      const dialogRef = this.dialog.open(CalendarSyncDialogComponent, {
        width: '350px',
        data: { taskTitle: this.taskForm.value.title }
      });

      const result = await dialogRef.afterClosed().toPromise();
      const shouldSyncWithCalendar = result === true;

      // タスクの更新データを準備
      const updateData = {
        ...this.taskForm.value,
        updatedAt: new Date()
      };

      // カレンダー連携が必要な場合
      if (shouldSyncWithCalendar) {
        // 既存のカレンダーイベントを削除
        if (this.task.calendarEventId) {
          try {
            await this.calendarService.deleteCalendarEvent(this.task);
            console.log('古いカレンダーイベントを削除しました');
          } catch (error) {
            console.error('古いカレンダーイベントの削除に失敗しました:', error);
            this.snackBar.open('古いカレンダーイベントの削除に失敗しました', '閉じる', { duration: 3000 });
            return;
          }
        }

        // タスクを更新（calendarEventIdを一時的に空文字列に）
        const taskRef = doc(this.firestore, 'tasks', this.task.id);
        await updateDoc(taskRef, {
          ...updateData,
          calendarEventId: ''
        });

        // 新しいカレンダーイベントを作成
        try {
          const newTask = { ...this.task, ...updateData, calendarEventId: '' };
          await this.calendarService.addTaskToCalendar(newTask);
          console.log('新しいカレンダーイベントを作成しました');
        } catch (error) {
          console.error('新しいカレンダーイベントの作成に失敗しました:', error);
          this.snackBar.open('新しいカレンダーイベントの作成に失敗しました', '閉じる', { duration: 3000 });
          return;
        }
      } else {
        // カレンダー連携なしでタスクのみ更新
        const taskRef = doc(this.firestore, 'tasks', this.task.id);
        await updateDoc(taskRef, updateData);
      }

      this.snackBar.open('タスクを更新しました', '閉じる', { duration: 3000 });
      this.router.navigate(['/tasks', this.task.id]);
    } catch (error) {
      console.error('タスクの更新に失敗しました:', error);
      this.snackBar.open('タスクの更新に失敗しました', '閉じる', { duration: 3000 });
    } finally {
      this.saving = false;
    }
  }
} 