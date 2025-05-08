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
import { Subscription, Observable } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { CalendarService } from '../../services/calendar.service';
import { CalendarSyncDialogComponent } from '../calendar-sync-dialog/calendar-sync-dialog.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { ToastContainerComponent } from '../../../../shared/components/toast-container/toast-container.component';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../../projects/services/project.service';
import { Project } from '../../../projects/models/project.model';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { Firestore } from '@angular/fire/firestore';
import { MatTabsModule } from '@angular/material/tabs';
import { DragDropModule, CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';

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

// ファイルタイプの列挙型
enum FileType {
  ASANA = 'ASANA',
  TRELLO = 'TRELLO',
  SAMPLE = 'SAMPLE',
  UNKNOWN = 'UNKNOWN'
}

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
    MatNativeDateModule,
    ToastContainerComponent,
    MatTabsModule,
    DragDropModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'ja-JP' },
    { provide: DateAdapter, useClass: CustomDateAdapter }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TaskListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['select', 'title', 'category', 'priority', 'dueDate', 'actions'];
  dataSource = new MatTableDataSource<any>();
  loading = false;
  filterForm: FormGroup;
  searchControl: FormControl;
  selectedTasks: any[] = [];
  editingTask: any = null;
  editingField: string | null = null;
  categories: string[] = [];
  categories$: Observable<string[]>;
  tasks: Task[] = [];
  projectName: string = '';
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
    private authService: AuthService,
    private calendarService: CalendarService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private firestore: Firestore
  ) {
    this.searchControl = new FormControl('');
    this.filterForm = this.fb.group({
      category: [''],
      status: [''],
      priority: [''],
      search: this.searchControl
    });
    this.categories$ = this.categoryService.categories$;
  }

  ngOnInit(): void {
    this.projectService.loadProjects();

    this.route.params.subscribe(params => {
      const projectId = params['id'];
      console.log('URLのprojectId:', projectId);
      if (projectId) {
        this.projectName = '';
        this.projectService.projects$.subscribe(projects => {
          const project = projects.find((p: Project) => p.id === projectId);
          console.log('見つかったプロジェクト:', project);
          if (project) {
            this.projectName = project.name;
          }
        });
        this.taskService.getTasksByProject(projectId).subscribe(tasks => {
          this.tasks = tasks;
          this.dataSource.data = tasks;
        });
      } else {
        this.projectName = 'すべてのタスク';
        this.taskService.tasks$.subscribe(tasks => {
          this.tasks = tasks;
          this.dataSource.data = tasks;
    });
      }
    });

    this.setupFilterForm();

    // リアルタイムアップデートの購読
    this.subscription = this.taskService.tasks$.subscribe(
      (tasks) => {
        console.log('Received tasks update:', tasks);
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
      
      // タスクリストを更新
      this.tasks = [...tasks];
      
      // データソースを完全に再作成
      this.dataSource = new MatTableDataSource<Task>(this.tasks);
      
      // データソースの設定を再適用
      if (this.sort) {
      this.dataSource.sort = this.sort;
      }
      if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      }
      this.dataSource.filterPredicate = this.createFilter();
      
      this.notificationService.checkTaskDeadlines(tasks);
      this.applyFilters();
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
    const projectId = this.route.snapshot.params['id'];
    if (projectId) {
      this.router.navigate(['/projects', projectId, 'tasks', 'new']);
    } else {
    this.router.navigate(['/tasks/new']);
    }
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
      console.log('日付変更処理を開始:', task.id, task.title);
      console.log('選択された日付:', event.value);
      
      // 日付がクリアされた場合はnullを設定
      const timestamp = event.value ? {
        seconds: Math.floor(event.value.getTime() / 1000),
        nanoseconds: 0
      } : null;
      
      console.log('変換後のタイムスタンプ:', timestamp);

      // カレンダー連携の確認ダイアログを表示
      const dialogRef = this.dialog.open(CalendarSyncDialogComponent, {
        width: '350px',
        data: { taskTitle: task.title }
      });

      const result = await dialogRef.afterClosed().toPromise();
      const shouldSyncWithCalendar = result === true;
      console.log('カレンダー連携の選択結果:', shouldSyncWithCalendar);

      // カレンダー連携が必要な場合
      if (shouldSyncWithCalendar) {
        // 最新のタスク情報を取得
        const currentTask = await this.taskService.getTask(task.id);
        const oldCalendarEventId = currentTask.calendarEventId;
        console.log('古いカレンダーイベントID:', oldCalendarEventId);
        
        // 古いカレンダーイベントを削除
        if (oldCalendarEventId) {
          try {
            console.log('古いカレンダーイベントの削除を開始');
            await this.calendarService.deleteCalendarEvent({ ...currentTask, calendarEventId: oldCalendarEventId });
            console.log('古いカレンダーイベントの削除が完了');
          } catch (error) {
            console.error('古いカレンダーイベントの削除に失敗しました:', error);
            this.snackBar.open('古いカレンダーイベントの削除に失敗しました', '閉じる', { duration: 3000 });
            return;
          }
        }
        
        // タスクの更新（calendarEventIdを一時的に空文字列に）
        try {
          console.log('タスクの更新を開始');
          await this.taskService.updateTask(task.id, { 
            dueDate: timestamp,
            calendarEventId: ''
          });
          console.log('タスクの更新が完了');
        } catch (error) {
          console.error('タスクの更新に失敗しました:', error);
          this.snackBar.open('タスクの更新に失敗しました', '閉じる', { duration: 3000 });
          return;
        }
        
        // 新しいカレンダーイベントを作成
        try {
          console.log('新しいカレンダーイベントの作成を開始');
          const newTask = { ...currentTask, dueDate: timestamp, calendarEventId: '' };
          await this.calendarService.addTaskToCalendar(newTask);
          console.log('新しいカレンダーイベントの作成が完了');
        } catch (error) {
          console.error('新しいカレンダーイベントの作成に失敗しました:', error);
          this.snackBar.open('新しいカレンダーイベントの作成に失敗しました', '閉じる', { duration: 3000 });
          return;
        }
      } else {
        // カレンダー連携なしでタスクのみ更新
        try {
          console.log('カレンダー連携なしでタスクを更新');
          await this.taskService.updateTask(task.id, { dueDate: timestamp });
          console.log('タスクの更新が完了');
        } catch (error) {
          console.error('タスクの更新に失敗しました:', error);
          this.snackBar.open('タスクの更新に失敗しました', '閉じる', { duration: 3000 });
          return;
        }
      }
      
      // 更新後にタスクリストを再読み込み
      console.log('タスクリストの再読み込みを開始');
      await this.loadTasks();
      console.log('タスクリストの再読み込みが完了');
      this.stopEditing();
    } catch (error) {
      console.error('日付の更新に失敗しました:', error);
      this.snackBar.open('日付の更新に失敗しました', '閉じる', { duration: 3000 });
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authService.signOut();
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public async onImportCSV(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.snackBar.open('ファイルが選択されていません', '閉じる', { duration: 3000 });
      return;
    }

    const file = input.files[0];
    if (!file.name.endsWith('.csv')) {
      this.snackBar.open('CSVファイルを選択してください', '閉じる', { duration: 3000 });
      return;
    }

    try {
      this.loading = true;
      const text = await file.text();
      
      // CSVをパース
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
      if (rows.length < 2) {
        this.snackBar.open('CSVファイルが空です', '閉じる', { duration: 3000 });
        return;
      }

      const headers = rows[0];
      const data = rows.slice(1);
      
      // タスクデータに変換
      const tasks = data.map(row => {
        const taskData: Omit<Task, 'id'> = {
          title: row[headers.indexOf('タイトル')] || '',
          description: row[headers.indexOf('説明')] || '',
          status: (row[headers.indexOf('ステータス')] as '未着手' | '進行中' | '完了') || '未着手',
          priority: (row[headers.indexOf('優先度')] as '低' | '中' | '高') || '中',
          category: row[headers.indexOf('カテゴリ')] || '',
          assignedTo: row[headers.indexOf('担当者')] || '',
          dueDate: row[headers.indexOf('期限')]?.trim() ? Timestamp.fromDate(new Date(row[headers.indexOf('期限')])) : null,
          userId: 'user1',
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          completed: row[headers.indexOf('完了')] === '完了' || false
        };
        return taskData;
      }).filter(task => task.title.trim() !== ''); // タイトルが空のタスクを除外

      if (tasks.length === 0) {
        this.snackBar.open('有効なタスクデータが見つかりません', '閉じる', { duration: 3000 });
        return;
      }

      // タスクを登録
      let successCount = 0;
      for (const task of tasks) {
        try {
          await this.taskService.createTask(task);
          successCount++;
        } catch (error) {
          console.error('タスクの作成に失敗しました:', error);
        }
      }

      this.snackBar.open(`${successCount}件のタスクをインポートしました`, '閉じる', { duration: 3000 });
      
      // タスクリストを更新
      await this.loadTasks();
      
    } catch (error) {
      console.error('CSVのインポートに失敗しました:', error);
      this.snackBar.open('CSVのインポートに失敗しました', '閉じる', { duration: 3000 });
    } finally {
      this.loading = false;
      // 入力フィールドをリセット
      input.value = '';
      // 入力イベントを強制的に発火
      input.dispatchEvent(new Event('change'));
    }
  }

  // ファイルタイプを判定するメソッド
  private detectFileType(file: File, content: string): FileType {
    const firstLine = content.split('\n')[0];
    
    // AsanaのCSV判定
    if (firstLine.includes('Name') && firstLine.includes('Section/Column') && firstLine.includes('Assignee')) {
      return FileType.ASANA;
    }
    
    // TrelloのCSV判定
    if (firstLine.includes('Card ID') && firstLine.includes('Card Name') && firstLine.includes('List Name')) {
      return FileType.TRELLO;
    }
    
    // サンプルCSV判定
    if (firstLine.includes('タイトル') && firstLine.includes('説明') && firstLine.includes('ステータス')) {
      return FileType.SAMPLE;
    }
    
    return FileType.UNKNOWN;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.snackBar.open('ファイルが選択されていません', '閉じる', { duration: 3000 });
      return;
    }

    const file = input.files[0];
    this.processFile(file).then(() => {
      // ファイル入力フィールドをリセット
      input.value = '';
      // 入力イベントを強制的に発火
      input.dispatchEvent(new Event('change'));
    });
  }

  private async processFile(file: File): Promise<void> {
    try {
      const content = await file.text();
      const fileType = this.detectFileType(file, content);
      
      switch (fileType) {
        case FileType.ASANA:
          await this.importAsanaCSV(file);
          break;
        case FileType.TRELLO:
          await this.importTrelloCSV(file);
          break;
        case FileType.SAMPLE:
          await this.importSampleCSV(file);
          break;
        default:
          this.snackBar.open('サポートされていないファイル形式です', '閉じる', { duration: 3000 });
      }
    } catch (error) {
      console.error('ファイルの処理に失敗しました:', error);
      this.snackBar.open('ファイルの処理に失敗しました', '閉じる', { duration: 3000 });
    }
  }

  // カテゴリを追加するメソッド
  private addCategory(category: string): void {
    if (!this.categories.includes(category)) {
      this.categories.push(category);
      this.categoryService.addCategory(category);
    }
  }

  async importAsanaCSV(file: File): Promise<void> {
    try {
      this.loading = true;
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(','));
      const headers = rows[0];

      // Asanaカテゴリを追加
      this.addCategory('Asana');

      const tasks = rows.slice(1).map(row => {
        // Asanaのステータスを変換
        const asanaStatus = row[headers.indexOf('Section/Column')] || '';
        let status: '未着手' | '進行中' | '完了';
        switch (asanaStatus) {
          case 'To-Do':
            status = '未着手';
            break;
          case '進行中':
            status = '進行中';
            break;
          case '完了':
            status = '完了';
            break;
          default:
            status = '未着手';
        }

        const taskData: Omit<Task, 'id'> = {
          title: row[headers.indexOf('Name')] || '',
          description: row[headers.indexOf('Notes')] || '',
          status: status,
          priority: row[headers.indexOf('優先度')] as '低' | '中' | '高' || '中',
          category: 'Asana',
          assignedTo: row[headers.indexOf('Assignee')] || '',
          dueDate: row[headers.indexOf('Due Date')]?.trim() ? Timestamp.fromDate(new Date(row[headers.indexOf('Due Date')])) : null,
          userId: '',
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          completed: row[headers.indexOf('完了')] === '完了' || false
        };
        return taskData;
      });

      let successCount = 0;
      for (const task of tasks) {
        try {
          await this.taskService.createTask(task);
          successCount++;
        } catch (error) {
          console.error('Error creating task:', error);
          this.snackBar.open(`タスクの作成に失敗しました: ${task.title}`, '閉じる', {
            duration: 3000
          });
        }
      }

      this.snackBar.open(`${successCount}件のタスクをインポートしました`, '閉じる', {
        duration: 3000
      });
      await this.loadTasks();
    } catch (error) {
      console.error('Error importing Asana CSV:', error);
      this.snackBar.open('Asana CSVのインポートに失敗しました', '閉じる', {
        duration: 3000
      });
    } finally {
      this.loading = false;
    }
  }

  async importTrelloCSV(file: File): Promise<void> {
    try {
      this.loading = true;
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
          dueDate: row[dueDateIndex]?.trim() ? Timestamp.fromDate(new Date(row[dueDateIndex])) : null,
          completed: row[headers.indexOf('完了')] === '完了' || false
        } as const;

        return taskData;
      }).filter(task => task !== null);

      let successCount = 0;
      for (const task of tasks) {
        try {
          await this.taskService.createTask(task as Task);
          successCount++;
        } catch (error) {
          console.error('Error creating task:', error);
          this.snackBar.open(`タスクの作成に失敗しました: ${task.title}`, '閉じる', {
            duration: 3000
          });
        }
      }

      this.snackBar.open(`${successCount}件のタスクをインポートしました`, '閉じる', {
        duration: 3000
      });
      await this.loadTasks();
    } catch (error) {
      console.error('Error importing Trello CSV:', error);
      this.snackBar.open('Trello CSVのインポートに失敗しました', '閉じる', {
        duration: 3000
      });
    } finally {
      this.loading = false;
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

  private generateTaskId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  async importSampleCSV(file: File): Promise<void> {
    try {
      const reader = new FileReader();
      const tasks: Task[] = [];

      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(',').map(value => value.trim());
          const task: Task = {
            id: this.generateTaskId(),
            title: values[headers.indexOf('タイトル')] || '',
            description: values[headers.indexOf('説明')] || '',
            status: (values[headers.indexOf('ステータス')] as '未着手' | '進行中' | '完了') || '未着手',
            priority: (values[headers.indexOf('優先度')] as '低' | '中' | '高') || '中',
            category: values[headers.indexOf('カテゴリ')] || '',
            assignedTo: values[headers.indexOf('担当者')] || '',
            dueDate: values[headers.indexOf('期限')] ? Timestamp.fromDate(new Date(values[headers.indexOf('期限')])) : null,
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
            userId: 'user1',
            completed: values[headers.indexOf('完了')] === '完了' || false
          };

          tasks.push(task);
        }

        for (const task of tasks) {
          await this.taskService.createTask(task);
        }
        this.snackBar.open('タスクをインポートしました', '閉じる', { duration: 3000 });
        this.loadTasks();
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('CSVインポートエラー:', error);
      this.snackBar.open('CSVのインポートに失敗しました', '閉じる', { duration: 3000 });
    }
  }

  getTasksByStatus(status: string): Task[] {
    const filteredTasks = this.dataSource.data.filter(task => task.status === status);
    console.log(`Status ${status} tasks:`, filteredTasks);
    return filteredTasks;
  }

  async onTaskDrop(event: CdkDragDrop<any[]>, newStatus: string) {
    const task = event.item.data;
    if (event.previousContainer !== event.container && task.status !== newStatus) {
      // ステータスを即時変更（UI反映用）
      task.status = newStatus;
      // ローカル配列も移動
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      // Firestoreも更新
      await this.updateTaskField(task, 'status', newStatus);
    }
  }

  get dropListIds(): string[] {
    return this.statusOptions.map(s => 'dropList-' + s);
  }
} 