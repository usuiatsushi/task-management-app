import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { BulkEditDialogComponent } from '../bulk-edit-dialog/bulk-edit-dialog.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelect } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Timestamp } from 'firebase/firestore';

const MY_FORMATS = {
  parse: {
    dateInput: 'yyyy/MM/dd',
  },
  display: {
    dateInput: 'yyyy/MM/dd',
    monthYearLabel: 'yyyy年MM月',
    dateA11yLabel: 'yyyy/MM/dd',
    monthYearA11yLabel: 'yyyy年MM月',
  },
};

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TaskListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['select', 'title', 'category', 'status', 'priority', 'dueDate', 'actions'];
  dataSource = new MatTableDataSource<any>();
  loading = false;
  filterForm: FormGroup;
  searchControl: FormControl;
  selectedTasks: any[] = [];
  editingTask: any = null;
  editingField: string | null = null;
  categories: string[] = [];

  // 選択肢の定義
  statusOptions = ['未着手', '進行中', '完了'];
  priorityOptions = ['低', '中', '高'];

  // 日付フィルター
  filterDates = (d: Date | null): boolean => {
    return true;
  };

  // 日付フォーマット
  dateFormat = {
    parse: {
      dateInput: 'yyyy/MM/dd',
    },
    display: {
      dateInput: 'yyyy/MM/dd',
      monthYearLabel: 'yyyy年MM月',
      dateA11yLabel: 'yyyy/MM/dd',
      monthYearA11yLabel: 'yyyy年MM月',
    },
  };

  // TimestampをDateに変換するヘルパーメソッド
  getDateFromTimestamp(timestamp: Timestamp | Date | any): Date {
    try {
      if (!timestamp) {
        return new Date();
      }

      if (timestamp instanceof Timestamp) {
        const date = timestamp.toDate();
        return isNaN(date.getTime()) ? new Date() : date;
      } else if (timestamp instanceof Date) {
        return isNaN(timestamp.getTime()) ? new Date() : timestamp;
      } else if (timestamp && typeof timestamp.toDate === 'function') {
        const date = timestamp.toDate();
        return isNaN(date.getTime()) ? new Date() : date;
      } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? new Date() : date;
      } else {
        return new Date();
      }
    } catch (error) {
      console.error('日付の変換に失敗しました:', error);
      return new Date();
    }
  }

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('categorySelect') categorySelect!: MatSelect;

  constructor(
    private taskService: TaskService,
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.searchControl = new FormControl('');
    this.filterForm = this.fb.group({
      category: [''],
      status: [''],
      priority: [''],
      search: this.searchControl
    });
  }

  ngOnInit(): void {
    this.loadTasks();
    this.setupFilterForm();
    this.categoryService.categories$.subscribe(categories => {
      this.categories = categories;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  private setupFilterForm(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  async loadTasks(): Promise<void> {
    this.loading = true;
    try {
      const tasks = await this.taskService.getTasks();
      this.dataSource.data = tasks;
      this.dataSource.filterPredicate = this.createFilter();
      this.notificationService.checkTaskDeadlines(tasks);
    } catch (error) {
      console.error('タスクの読み込みに失敗しました:', error);
      this.snackBar.open('タスクの読み込みに失敗しました', '閉じる', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  private createFilter(): (data: any, filter: string) => boolean {
    return (data: any) => {
      const filters = this.filterForm.value;
      const categoryMatch = !filters.category || data.category === filters.category;
      const statusMatch = !filters.status || data.status === filters.status;
      const priorityMatch = !filters.priority || data.priority === filters.priority;
      const searchMatch = !filters.search || 
        data.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (data.description && data.description.toLowerCase().includes(filters.search.toLowerCase()));

      return categoryMatch && statusMatch && priorityMatch && searchMatch;
    };
  }

  getUniqueCategories(): string[] {
    return this.categories;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case '未着手':
        return 'status-not-started';
      case '進行中':
        return 'status-in-progress';
      case '完了':
        return 'status-completed';
      default:
        return '';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case '低':
        return 'priority-low';
      case '中':
        return 'priority-medium';
      case '高':
        return 'priority-high';
      default:
        return '';
    }
  }

  applyFilters(): void {
    this.dataSource.filter = 'trigger';
  }

  resetFilters(): void {
    this.filterForm.reset();
  }

  viewTask(task: any): void {
    this.router.navigate(['/tasks', task.id]);
  }

  navigateToNewTask(): void {
    this.router.navigate(['/tasks/new']);
  }

  async deleteTask(task: any, event: Event): Promise<void> {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'タスクの削除',
        message: `「${task.title}」を削除してもよろしいですか？`,
        confirmText: '削除',
        cancelText: 'キャンセル'
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          await this.taskService.deleteTask(task.id);
          this.snackBar.open('タスクを削除しました', '閉じる', { duration: 3000 });
          this.loadTasks();
        } catch (error) {
          console.error('タスクの削除に失敗しました:', error);
          this.snackBar.open('タスクの削除に失敗しました', '閉じる', { duration: 3000 });
        }
      }
    });
  }

  isSelected(task: any): boolean {
    return this.selectedTasks.some(t => t.id === task.id);
  }

  isAllSelected(): boolean {
    return this.dataSource.data.length === this.selectedTasks.length;
  }

  isSomeSelected(): boolean {
    return this.selectedTasks.length > 0 && this.selectedTasks.length < this.dataSource.data.length;
  }

  toggleTaskSelection(task: any): void {
    const index = this.selectedTasks.findIndex(t => t.id === task.id);
    if (index === -1) {
      this.selectedTasks.push(task);
    } else {
      this.selectedTasks.splice(index, 1);
    }
  }

  toggleAllSelection(event: any): void {
    if (event.checked) {
      this.selectedTasks = [...this.dataSource.data];
    } else {
      this.selectedTasks = [];
    }
  }

  async openBulkEditDialog(): Promise<void> {
    const dialogRef = this.dialog.open(BulkEditDialogComponent, {
      data: { tasks: this.selectedTasks }
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      try {
        this.loading = true;
        const updates = {
          ...result,
          updatedAt: Timestamp.now()
        };

        await Promise.all(
          this.selectedTasks.map(task =>
            this.taskService.updateTask(task.id, updates)
          )
        );

        this.snackBar.open(`${this.selectedTasks.length}件のタスクを更新しました`, '閉じる', { duration: 3000 });
        this.selectedTasks = [];
        await this.loadTasks();
      } catch (error) {
        console.error('タスクの一括更新に失敗しました:', error);
        this.snackBar.open('タスクの一括更新に失敗しました', '閉じる', { duration: 3000 });
      } finally {
        this.loading = false;
      }
    }
  }

  async openBulkDeleteDialog(): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'タスクの一括削除',
        message: `選択された${this.selectedTasks.length}件のタスクを削除してもよろしいですか？`,
        confirmText: '削除',
        cancelText: 'キャンセル'
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          this.loading = true;
          await Promise.all(
            this.selectedTasks.map(task =>
              this.taskService.deleteTask(task.id)
            )
          );

          this.snackBar.open(`${this.selectedTasks.length}件のタスクを削除しました`, '閉じる', { duration: 3000 });
          this.selectedTasks = [];
          await this.loadTasks();
        } catch (error) {
          console.error('タスクの一括削除に失敗しました:', error);
          this.snackBar.open('タスクの一括削除に失敗しました', '閉じる', { duration: 3000 });
        } finally {
          this.loading = false;
        }
      }
    });
  }

  startEditing(task: any, field: string) {
    this.editingTask = task;
    this.editingField = field;
  }

  stopEditing() {
    this.editingTask = null;
    this.editingField = null;
  }

  async updateTaskField(task: any, field: string, value: any) {
    try {
      const updateData = {
        [field]: value
      };
      await this.taskService.updateTask(task.id, updateData);
      this.snackBar.open('タスクを更新しました', '閉じる', { duration: 3000 });
      this.loadTasks();
    } catch (error) {
      console.error('タスクの更新に失敗しました:', error);
      this.snackBar.open('タスクの更新に失敗しました', '閉じる', { duration: 3000 });
    }
  }

  onFieldChange(task: any, field: string, event: any) {
    const value = event.target.value;
    this.updateTaskField(task, field, value);
    this.stopEditing();
  }

  onSelectChange(task: any, field: string, event: any) {
    const value = event.value;
    this.updateTaskField(task, field, value);
    this.stopEditing();
  }

  onDateChange(task: any, event: any) {
    const newDate = event.value;
    const timestamp = Timestamp.fromDate(newDate);
    this.updateTaskField(task, 'dueDate', timestamp);
    this.stopEditing();
  }
} 