import { Component, OnInit, ViewChild, AfterViewInit, LOCALE_ID, Injectable, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { MatNativeDateModule, MAT_DATE_FORMATS, MAT_DATE_LOCALE, DateAdapter, NativeDateAdapter } from '@angular/material/core';
import { Timestamp } from 'firebase/firestore';
import { Task } from '../../models/task.model';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';

@Injectable()
class CustomDateAdapter extends NativeDateAdapter {
  override getDateNames(): string[] {
    return Array.from(Array(31), (_, i) => `${i + 1}`);
  }

  override getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    return Array.from(Array(12), (_, i) => `${i + 1}`);
  }

  override getYearName(date: Date): string {
    return `${date.getFullYear()}`;
  }
}

const MY_FORMATS = {
  parse: {
    dateInput: 'yyyy/MM/dd',
  },
  display: {
    dateInput: 'yyyy/MM/d',
    monthYearLabel: 'yyyy/MM',
    dateA11yLabel: 'yyyy/MM/dd',
    monthYearA11yLabel: 'yyyy/MM',
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
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'ja-JP' },
    { provide: DateAdapter, useClass: CustomDateAdapter }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TaskListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['select', 'title', 'category', 'status', 'priority', 'dueDate', 'actions'];
  dataSource = new MatTableDataSource<any>();
  loading = false;
  filterForm: FormGroup;
  searchControl: FormControl;
  selectedTasks: any[] = [];
  editingTask: any = null;
  editingField: string | null = null;
  categories: string[] = [];
  tasks: Task[] = [];
  private subscription: Subscription | null = null;

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
  getDateFromTimestamp(timestamp: any): Date {
    if (!timestamp) return new Date();

    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }

    if (typeof timestamp === 'object' && 'seconds' in timestamp) {
      return new Timestamp(timestamp.seconds, timestamp.nanoseconds || 0).toDate();
    }

    if (timestamp instanceof Date) {
      return timestamp;
    }

    return new Date(timestamp);
  }

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('categorySelect') categorySelect!: MatSelect;

  priorityOrder = { '高': 3, '中': 2, '低': 1 };
  statusOrder = { '未着手': 1, '進行中': 2, '完了': 3 };

  constructor(
    private taskService: TaskService,
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
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

    // リアルタイムアップデートの購読
    this.subscription = this.taskService.tasks$.subscribe(
      (tasks) => {
        console.log('Received tasks update:', tasks.length);
        this.tasks = tasks;
        this.dataSource.data = tasks;
        
        // ソートとページネーションの設定を確認
        if (this.sort && !this.dataSource.sort) {
          this.dataSource.sort = this.sort;
        }
        if (this.paginator && !this.dataSource.paginator) {
          this.dataSource.paginator = this.paginator;
        }

        // フィルター述語を設定
        this.dataSource.filterPredicate = this.createFilter();
        
        // 現在のフィルターを適用（フィルターが設定されている場合のみ）
        const currentFilters = this.filterForm.value;
        if (Object.values(currentFilters).some(value => value)) {
          this.applyFilters();
        }

        this.notificationService.checkTaskDeadlines(tasks);

        this.cdr.detectChanges();
      }
    );
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    // 優先度・ステータスのカスタムソート
    this.dataSource.sortingDataAccessor = (item, property) => {
      if (property === 'priority') {
        return this.priorityOrder[item.priority as keyof typeof this.priorityOrder] || 0;
      }
      if (property === 'status') {
        return this.statusOrder[item.status as keyof typeof this.statusOrder] || 0;
      }
      return item[property];
    };
  }

  private setupFilterForm(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  async loadTasks(): Promise<void> {
    console.log('Loading tasks...');
    this.loading = true;
    try {
      const tasks = await this.taskService.getTasks();
      console.log('Tasks loaded:', tasks);
      this.dataSource.data = tasks;
      this.dataSource.filterPredicate = this.createFilter();
      this.notificationService.checkTaskDeadlines(tasks);
    } catch (error) {
      console.error('タスクの読み込みに失敗しました:', error);
      this.snackBar.open('タスクの読み込みに失敗しました', '閉じる', { duration: 3000 });
    } finally {
      this.loading = false;
      console.log('Task loading completed');
    }
  }

  private createFilter(): (data: any, filter: string) => boolean {
    return (data: any) => {
      if (!data) return false;
      
      const filters = this.filterForm.value;
      const searchTerm = filters.search ? filters.search.toLowerCase() : '';
      
      const categoryMatch = !filters.category || data.category === filters.category;
      const statusMatch = !filters.status || data.status === filters.status;
      const priorityMatch = !filters.priority || data.priority === filters.priority;
      const searchMatch = !searchTerm || 
        (data.title && data.title.toLowerCase().includes(searchTerm)) ||
        (data.description && data.description.toLowerCase().includes(searchTerm));

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
    const filterValues = this.filterForm.value;
    console.log('Applying filters:', filterValues);
    console.log('Current data length:', this.dataSource.data.length);
    
    // フィルターをトリガー
    this.dataSource.filter = JSON.stringify(filterValues);
    
    // ページネーターをリセット
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    
    console.log('Filtered data length:', this.dataSource.filteredData.length);
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
      console.log(`Updating field "${field}" for task:`, task);
      console.log('New value:', value);

      const updateData = {
        [field]: value
      };

      await this.taskService.updateTask(task.id, updateData);
      this.snackBar.open('タスクを更新しました', '閉じる', { duration: 3000 });
      
      // 更新後にタスクリストを再読み込み
      await this.loadTasks();
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

  async onDateChange(task: any, event: any) {
    const newDate = event.value;
    if (!newDate) return;

    try {
      console.log('Selected date:', newDate);
      
      // 日付をTimestamp形式のオブジェクトとして渡す
      const timestamp = {
        seconds: Math.floor(newDate.getTime() / 1000),
        nanoseconds: 0
      };
      
      console.log('Timestamp to be sent:', timestamp);
      await this.updateTaskField(task, 'dueDate', timestamp);
      
      // 更新後にタスクリストを再読み込み
      await this.loadTasks();
      this.stopEditing();
    } catch (error) {
      console.error('日付の更新に失敗しました:', error);
      this.snackBar.open('日付の更新に失敗しました', '閉じる', { duration: 3000 });
    }
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public exportTasksToCSV(): void {
    const headers = ['タイトル', '説明', 'ステータス', '優先度', 'カテゴリ', '担当者', '期限'];
    const rows = this.tasks.map(task => [
      task.title,
      task.description,
      task.status,
      task.priority,
      task.category,
      task.assignedTo,
      this.getDateFromTimestamp(task.dueDate).toLocaleDateString()
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  public async exportTasksToExcel(): Promise<void> {
    const headers = ['タイトル', '説明', 'ステータス', '優先度', 'カテゴリ', '担当者', '期限'];
    const rows = this.tasks.map(task => [
      task.title,
      task.description,
      task.status,
      task.priority,
      task.category,
      task.assignedTo,
      this.getDateFromTimestamp(task.dueDate).toLocaleDateString()
    ]);
    const worksheetData = [headers, ...rows];
    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Tasks');
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }
} 