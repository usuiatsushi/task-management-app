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

  // デフォルトのカテゴリ選択肢
  defaultCategories = ['技術的課題', '業務フロー', 'バグ修正', '新機能・改善提案'];

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

  // フィルタリング用のカテゴリを取得
  getFilterCategories(): string[] {
    const categories = new Set(this.tasks.map(task => task.category));
    return Array.from(categories).filter(category => category !== '');
  }

  // 編集用のカテゴリを取得（デフォルト + 現在のタスクのカテゴリ）
  getEditCategories(): string[] {
    const taskCategories = new Set(this.tasks.map(task => task.category));
    const allCategories = new Set([...this.defaultCategories, ...taskCategories]);
    return Array.from(allCategories).filter(category => category !== '');
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
    try {
      console.log('Selected date:', event.value);
      
      // 日付がクリアされた場合はnullを設定
      const timestamp = event.value ? {
        seconds: Math.floor(event.value.getTime() / 1000),
        nanoseconds: 0
      } : null;
      
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
    // BOMを付与
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
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

  public async onImportCSV(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const text = await file.text();
    
    try {
      // CSVをパース
      const rows = text.split('\n').map(row => row.split(','));
      const headers = rows[0];
      const data = rows.slice(1);
      
      // タスクデータに変換
      const tasks = data.map(row => {
        const taskData: Omit<Task, 'id'> = {
          title: row[headers.indexOf('Name')] || '',
          description: row[headers.indexOf('Notes')] || '',
          status: row[headers.indexOf('Section/Column')] as '未着手' | '進行中' | '完了' || '未着手',
          priority: row[headers.indexOf('優先度')] as '低' | '中' | '高' || '中',
          category: row[headers.indexOf('Category')] || '',
          assignedTo: row[headers.indexOf('Assignee')] || '',
          dueDate: row[headers.indexOf('Due Date')]?.trim() ? Timestamp.fromDate(new Date(row[headers.indexOf('Due Date')])) : null,
          userId: '',
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date())
        };
        return taskData;
      });

      // タスクを登録
      for (const task of tasks) {
        if (task.title) { // タイトルがあるものだけ登録
          await this.taskService.createTask(task as Task);
        }
      }

      this.snackBar.open(`${tasks.length}件のタスクをインポートしました`, '閉じる', { duration: 3000 });
      this.loadTasks(); // タスク一覧を更新
    } catch (error) {
      console.error('CSVのインポートに失敗しました:', error);
      this.snackBar.open('CSVのインポートに失敗しました', '閉じる', { duration: 3000 });
    }
  }

  public downloadSampleCSV() {
    const csvContent = [
      'Name,Notes,Section/Column,Due Date,Assignee,優先度',
      'タスク管理アプリの機能追加,新しい機能を追加する必要があります,To-Do,2024/5/10,山田太郎,中',
      'バグの修正対応,重要なバグを修正する,進行中,2024/5/15,鈴木一郎,高',
      'ドキュメント作成,アプリケーションの使用方法をまとめる,To-Do,2024/5/20,佐藤花子,低'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sample_tasks.csv';
    link.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // CSVの内容を確認してTrelloのCSVかどうかを判断
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const firstLine = text.split('\n')[0];
        // TrelloのCSVの特徴的なヘッダーを確認
        if (firstLine.includes('Card ID') && firstLine.includes('Card Name') && firstLine.includes('List Name')) {
          this.importTrelloCSV(file);
        } else {
          this.importTasksFromCSV(file);
        }
      };
      reader.readAsText(file);
    }
  }

  // カテゴリを追加するメソッド
  private addCategory(category: string): void {
    if (!this.categories.includes(category)) {
      this.categories.push(category);
      this.categoryService.addCategory(category);
    }
  }

  async importTrelloCSV(file: File): Promise<void> {
    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
      const headers = rows[0];
      
      // Trelloカテゴリを追加
      this.addCategory('Trello');
      
      // ヘッダーのインデックスを取得
      const titleIndex = headers.indexOf('Card Name');
      const descriptionIndex = headers.indexOf('Card Description');
      const statusIndex = headers.indexOf('List Name');
      const dueDateIndex = headers.indexOf('Due Date');
      const assigneeIndex = headers.indexOf('Members');
      const assigneeNameIndex = headers.indexOf('Member Names');

      const tasks = rows.slice(1).map(row => {
        // タイトルが空の場合はスキップ
        if (!row[titleIndex]?.trim()) {
          return null;
        }

        // Trelloのステータスをアプリケーションのステータスに変換
        const trelloStatus = row[statusIndex] || '';
        let status: '未着手' | '進行中' | '完了';
        switch (trelloStatus) {
          case 'To Do':
            status = '未着手';
            break;
          case '作業中':
            status = '進行中';
            break;
          case '完了':
            status = '完了';
            break;
          default:
            status = '未着手';
        }

        // 担当者名を取得（Member Namesカラムがある場合はそれを使用）
        const assignedTo = assigneeNameIndex !== -1 && row[assigneeNameIndex] 
          ? row[assigneeNameIndex].trim() 
          : row[assigneeIndex]?.trim() || '';

        const taskData = {
          title: row[titleIndex]?.trim() || '',
          description: row[descriptionIndex]?.trim() || '',
          status: status as '未着手' | '進行中' | '完了',
          priority: '' as '低' | '中' | '高',
          category: 'Trello',
          assignedTo: assignedTo,
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          userId: '', // 後で設定
          dueDate: row[dueDateIndex]?.trim() ? Timestamp.fromDate(new Date(row[dueDateIndex])) : null
        } as const;

        return taskData;
      }).filter(task => task !== null);

      // タスクを登録
      for (const task of tasks) {
        try {
          await this.taskService.createTask(task as Task);
        } catch (error) {
          console.error('Error creating task:', error);
          this.snackBar.open(`タスクの作成に失敗しました: ${task.title}`, '閉じる', {
            duration: 3000
          });
        }
      }

      this.snackBar.open('Trelloからタスクをインポートしました', '閉じる', {
        duration: 3000
      });
      this.loadTasks(); // タスク一覧を更新
    } catch (error) {
      console.error('Error importing Trello CSV:', error);
      this.snackBar.open('Trello CSVのインポートに失敗しました', '閉じる', {
        duration: 3000
      });
    }
  }

  async importTasksFromCSV(file: File): Promise<void> {
    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => {
        // CSVの行を適切に分割（カンマを含むフィールドに対応）
        const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        return matches ? matches.map(val => val.replace(/^"|"$/g, '').trim()) : [];
      });
      const headers = rows[0];

      // ヘッダーのインデックスを取得
      const nameIndex = headers.indexOf('Name');
      const notesIndex = headers.indexOf('Notes');
      const sectionIndex = headers.indexOf('Section/Column');
      const dueDateIndex = headers.indexOf('Due Date');
      const assigneeIndex = headers.indexOf('Assignee');
      const priorityIndex = headers.indexOf('優先度');
      const statusIndex = headers.indexOf('ステータス');

      const tasks = rows.slice(1)
        .filter(row => row.length > 0 && row[nameIndex]?.trim())
        .map(row => {
          // Asanaのステータスを変換
          let status: '未着手' | '進行中' | '完了';
          const asanaSection = row[sectionIndex]?.trim() || '';
          
          switch (asanaSection.toLowerCase()) {
            case 'to-do':
            case 'todo':
              status = '未着手';
              break;
            case '進行中':
            case 'in progress':
              status = '進行中';
              break;
            case '完了':
            case 'done':
            case 'completed':
              status = '完了';
              break;
            default:
              status = '未着手';
          }

          // 優先度の変換
          let priority: '低' | '中' | '高' = '中';
          const rawPriority = row[priorityIndex]?.trim().toLowerCase() || '';
          if (rawPriority.includes('高') || rawPriority.includes('high')) {
            priority = '高';
          } else if (rawPriority.includes('低') || rawPriority.includes('low')) {
            priority = '低';
          }

          // タスクの内容に基づいてカテゴリを決定
          let category = '技術的課題';
          const title = row[nameIndex]?.trim() || '';
          const notes = row[notesIndex]?.trim() || '';
          
          if (title.includes('バグ') || notes.includes('バグ')) {
            category = 'バグ修正';
          } else if (title.includes('機能') || notes.includes('機能')) {
            category = '新機能・改善提案';
          } else if (title.includes('フロー') || notes.includes('フロー') || 
                    title.includes('ドキュメント') || notes.includes('ドキュメント')) {
            category = '業務フロー';
          }

          const dueDate = row[dueDateIndex]?.trim()
            ? Timestamp.fromDate(new Date(row[dueDateIndex]))
            : null;

          const taskData: Omit<Task, 'id'> = {
            title: title,
            description: notes || '',
            status: status,
            priority: priority,
            category: category,
            assignedTo: row[assigneeIndex]?.trim() || '',
            dueDate: dueDate,
            userId: '',
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date())
          };

          return taskData;
        });

      // タスクを保存
      for (const task of tasks) {
        try {
          await this.taskService.createTask(task as Task);
        } catch (error) {
          console.error('タスクの作成に失敗しました:', error);
          this.snackBar.open(`タスクの作成に失敗しました: ${task.title}`, '閉じる', {
            duration: 3000
          });
        }
      }

      this.snackBar.open(`${tasks.length}件のタスクをインポートしました`, '閉じる', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      
      // タスク一覧を更新
      await this.loadTasks();
    } catch (error) {
      console.error('CSVのインポートに失敗しました:', error);
      this.snackBar.open('CSVのインポートに失敗しました', '閉じる', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private convertAsanaStatus(status: string): string {
    switch (status) {
      case 'To-Do':
        return '未着手';
      case '進行中':
        return '進行中';
      case '完了':
        return '完了';
      default:
        return '未着手';
    }
  }
} 