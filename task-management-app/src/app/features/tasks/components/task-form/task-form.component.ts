import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc, setDoc, updateDoc, collection, addDoc } from '@angular/fire/firestore';
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
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
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
    MatIconModule
  ]
})
export class TaskFormComponent implements OnInit {
  taskForm: FormGroup;
  isEditMode = false;
  taskId: string | null = null;
  loading = false;
  categories: string[] = [];
  newCategoryName: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore,
    private snackBar: MatSnackBar,
    private taskService: TaskService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
  ) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      status: ['未着手', Validators.required],
      priority: ['中', Validators.required],
      dueDate: [new Date(), Validators.required],
      assignedTo: ['', Validators.required]
    });
  }

  async ngOnInit() {
    this.taskId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.taskId;

    // カテゴリの読み込み
    this.categoryService.categories$.subscribe(categories => {
      this.categories = categories;
      if (categories.length > 0 && !this.isEditMode) {
        this.taskForm.patchValue({ category: categories[0] });
      }
      this.cdr.detectChanges();
    });

    if (this.isEditMode && this.taskId) {
      await this.loadTask(this.taskId);
    }
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

  async onSubmit() {
    if (this.taskForm.valid) {
      try {
        this.loading = true;
        const now = new Date();
        const taskData = {
          ...this.taskForm.value,
          dueDate: this.taskForm.value.dueDate,
          createdAt: this.isEditMode ? this.taskForm.value.createdAt : now,
          updatedAt: now
        };

        if (this.isEditMode && this.taskId) {
          const taskRef = doc(this.firestore, 'tasks', this.taskId);
          await updateDoc(taskRef, taskData);
          this.snackBar.open('タスクを更新しました', '閉じる', { duration: 3000 });
        } else {
          const tasksRef = collection(this.firestore, 'tasks');
          await addDoc(tasksRef, taskData);
          this.snackBar.open('タスクを作成しました', '閉じる', { duration: 3000 });
        }

        this.router.navigate(['/tasks']);
      } catch (error) {
        console.error('タスクの保存に失敗しました:', error);
        this.snackBar.open('タスクの保存に失敗しました', '閉じる', { duration: 3000 });
      } finally {
        this.loading = false;
      }
    }
  }

  async addNewCategory() {
    if (this.newCategoryName && !this.categories.includes(this.newCategoryName)) {
      try {
        await this.categoryService.addCategory(this.newCategoryName);
        this.taskForm.patchValue({ category: this.newCategoryName });
        this.newCategoryName = '';
        this.snackBar.open('カテゴリを追加しました', '閉じる', { duration: 3000 });
      } catch (error) {
        this.snackBar.open('カテゴリの追加に失敗しました', '閉じる', { duration: 3000 });
      }
    }
  }
} 