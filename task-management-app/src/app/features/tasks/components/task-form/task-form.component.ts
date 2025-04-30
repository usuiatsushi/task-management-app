import { Component, OnInit, ChangeDetectorRef, ViewEncapsulation, AfterViewInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, enableIndexedDbPersistence } from '@angular/fire/firestore';
import { Task } from '../../models/task.model';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category.service';
import { CalendarService } from '../../services/calendar.service';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDividerModule,
    MatIconModule,
    MatTooltipModule
  ]
})
export class TaskFormComponent implements OnInit, AfterViewInit {
  taskForm: FormGroup;
  isEditMode = false;
  taskId: string | null = null;
  loading = false;
  categories: string[] = [];
  dueDateOnly: Date | null = null;
  dueTimeOnly: string = '23:59'; // デフォルト

  // カスタムコンパレータを追加
  compareWith = (o1: any, o2: any) => o1 === o2;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore,
    private snackBar: MatSnackBar,
    private taskService: TaskService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
    private calendarService: CalendarService,
    private ngZone: NgZone
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, this.titleValidator.bind(this)]],
      description: ['', [Validators.required, this.descriptionValidator.bind(this)]],
      category: ['', Validators.required],
      status: ['未着手', Validators.required],
      priority: ['中', Validators.required],
      dueDate: [new Date(), [Validators.required, this.dueDateValidator.bind(this)]],
      assignedTo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
      newCategoryName: ['']
    });
  }

  async ngOnInit() {
    // オフライン状態をチェック
    if (!navigator.onLine) {
      this.snackBar.open('オフライン状態です。インターネット接続を確認してください。', '閉じる', {
        duration: 5000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    this.taskId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.taskId;

    // オンライン状態の監視を開始
    window.addEventListener('online', this.handleOnlineStatus.bind(this));
    window.addEventListener('offline', this.handleOnlineStatus.bind(this));

    try {
    // カテゴリの読み込み
    this.categoryService.categories$.subscribe(categories => {
      this.categories = categories;
      this.cdr.detectChanges();
    });

    if (this.isEditMode && this.taskId) {
      await this.loadTask(this.taskId);
    }
    } catch (error) {
      console.error('初期化中にエラーが発生しました:', error);
      this.handleError(error);
    }
  }

  ngAfterViewInit() {
    // ビューの初期化後に変更検知を強制的に実行
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        this.ngZone.run(() => {
          this.cdr.detectChanges();
        });
      });
    });
  }

  private async loadTask(taskId: string) {
    try {
      this.loading = true;
      const taskRef = doc(this.firestore, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (taskDoc.exists()) {
        const task = taskDoc.data() as Task;
        this.taskForm.patchValue({
          ...task,
          dueDate: this.convertTimestampToDate(task.dueDate)
        });
      }
    } catch (error) {
      console.error('タスクの読み込みに失敗しました:', error);
      this.snackBar.open('タスクの読み込みに失敗しました', '閉じる', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  private convertTimestampToDate(timestamp: any): Date {
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
    return new Date();
  }

  onCancel() {
    this.router.navigate(['/tasks']);
  }

  ngOnDestroy() {
    // イベントリスナーの削除
    window.removeEventListener('online', this.handleOnlineStatus.bind(this));
    window.removeEventListener('offline', this.handleOnlineStatus.bind(this));
  }

  private handleOnlineStatus() {
    if (!navigator.onLine) {
      this.snackBar.open('オフライン状態です。インターネット接続を確認してください。', '閉じる', {
        duration: 5000,
        panelClass: ['warning-snackbar']
      });
    } else {
      this.snackBar.open('オンラインに復帰しました。', '閉じる', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }
  }

  private handleError(error: any) {
    let errorMessage = 'エラーが発生しました';
    
    if (error instanceof Error) {
      if (!navigator.onLine || error.message === 'network-error') {
        errorMessage = 'ネットワークエラーが発生しました。インターネット接続をご確認ください。';
      } else if (error.message.includes('permission-denied')) {
        errorMessage = '権限がありません。ログインしているかご確認ください。';
      } else if (error.message.includes('quota')) {
        errorMessage = 'サービスの制限に達しました。しばらく時間をおいて再度お試しください。';
      }
    }
    
    this.snackBar.open(errorMessage, '閉じる', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  async onSubmit() {
    if (!navigator.onLine) {
      this.handleError(new Error('network-error'));
      return;
    }

    if (this.taskForm.valid) {
      try {
        this.loading = true;
        // dueDateを23:59に設定
        const date: Date = this.taskForm.value.dueDate;
        const dueDate = new Date(date);
        dueDate.setHours(23, 59, 0, 0);

        const taskData = {
          ...this.taskForm.value,
          dueDate: dueDate, // Firestore用にTimestamp変換は既存ロジックで
          updatedAt: new Date()
        };

        if (this.isEditMode && this.taskId) {
          const taskRef = doc(this.firestore, 'tasks', this.taskId);
          await updateDoc(taskRef, taskData);
          await this.calendarService.updateCalendarEvent({ ...taskData, id: this.taskId });
          this.snackBar.open('タスクを更新しました', '閉じる', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        } else {
          const tasksRef = collection(this.firestore, 'tasks');
          const docRef = await addDoc(tasksRef, {
            ...taskData,
            createdAt: new Date()
          });
          await this.calendarService.addTaskToCalendar({ ...taskData, id: docRef.id });
          this.snackBar.open('タスクを作成しました', '閉じる', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }

        this.router.navigate(['/tasks']);
      } catch (error) {
        console.error('タスクの保存に失敗しました:', error);
        this.handleError(error);
      } finally {
        this.loading = false;
      }
    } else {
      Object.keys(this.taskForm.controls).forEach(key => {
        const control = this.taskForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });

      this.snackBar.open('入力内容に誤りがあります。エラーメッセージをご確認ください。', '閉じる', {
        duration: 5000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  addNewCategory(): void {
    const newCategory = this.taskForm.get('newCategoryName')?.value;
    if (newCategory && !this.categories.includes(newCategory)) {
      this.categoryService.addCategory(newCategory).then(() => {
      this.taskForm.patchValue({ category: newCategory });
      this.taskForm.get('newCategoryName')?.reset();
      }).catch(error => {
        console.error('カテゴリの追加に失敗しました:', error);
        this.snackBar.open('カテゴリの追加に失敗しました', '閉じる', {
          duration: 3000
        });
      });
    }
  }

  deleteCategory(category: string): void {
    if (category && this.categories.includes(category)) {
      this.categoryService.deleteCategory(category).then(() => {
        if (this.taskForm.get('category')?.value === category) {
          this.taskForm.patchValue({ category: '' });
        }
        this.snackBar.open('カテゴリを削除しました', '閉じる', {
          duration: 3000
        });
      }).catch(error => {
        console.error('カテゴリの削除に失敗しました:', error);
        this.snackBar.open('カテゴリの削除に失敗しました', '閉じる', {
          duration: 3000
        });
      });
    }
  }

  onCalendarSync() {
    if (this.taskForm.valid) {
      const taskData = this.taskForm.value;
      if (this.isEditMode && this.taskId) {
        this.calendarService.updateCalendarEvent({ ...taskData, id: this.taskId });
      } else {
        this.calendarService.addTaskToCalendar(taskData);
      }
    }
  }

  // カスタムバリデーター
  private titleValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const errors: ValidationErrors = {};

    if (value.length < 3) {
      errors['minlength'] = { requiredLength: 3, actualLength: value.length };
    }
    if (value.length > 50) {
      errors['maxlength'] = { requiredLength: 50, actualLength: value.length };
    }
    if (/[<>]/.test(value)) {
      errors['invalidChars'] = true;
    }

    return Object.keys(errors).length ? errors : null;
  }

  private descriptionValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const errors: ValidationErrors = {};

    if (value.length > 1000) {
      errors['maxlength'] = { requiredLength: 1000, actualLength: value.length };
    }
    if (/[<>]/.test(value)) {
      errors['invalidChars'] = true;
    }

    return Object.keys(errors).length ? errors : null;
  }

  private dueDateValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return { pastDate: true };
    }

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    if (selectedDate > maxDate) {
      return { futureDate: true };
    }

    return null;
  }

  // エラーメッセージを取得するヘルパーメソッド
  getErrorMessage(controlName: string): string {
    const control = this.taskForm.get(controlName);
    if (!control || !control.errors) return '';

    const errors = control.errors;
    
    if (errors['required']) return `${this.getFieldLabel(controlName)}は必須です`;
    if (errors['minlength']) return `${this.getFieldLabel(controlName)}は${errors['minlength'].requiredLength}文字以上で入力してください`;
    if (errors['maxlength']) return `${this.getFieldLabel(controlName)}は${errors['maxlength'].requiredLength}文字以下で入力してください`;
    if (errors['invalidChars']) return '特殊文字（<>）は使用できません';
    if (errors['pastDate']) return '過去の日付は選択できません';
    if (errors['futureDate']) return '1年以上先の日付は選択できません';

    return '入力内容を確認してください';
  }

  private getFieldLabel(controlName: string): string {
    const labels: { [key: string]: string } = {
      title: 'タイトル',
      description: '説明',
      category: 'カテゴリ',
      status: 'ステータス',
      priority: '優先度',
      dueDate: '期限',
      assignedTo: '担当者'
    };
    return labels[controlName] || controlName;
  }

  // 保存時にdueDateを生成
  saveTask() {
    if (this.dueDateOnly && this.dueTimeOnly) {
      const [hours, minutes] = this.dueTimeOnly.split(':').map(Number);
      const dueDate = new Date(this.dueDateOnly);
      dueDate.setHours(hours, minutes, 0, 0);
      // Firestore用にTimestamp変換
      const dueTimestamp = Timestamp.fromDate(dueDate);
      // ...タスク保存処理
    }
  }
} 