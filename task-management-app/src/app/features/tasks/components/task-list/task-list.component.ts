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
import { Subscription, Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { CalendarService } from '../../services/calendar.service';
import { CalendarSyncDialogComponent } from '../calendar-sync-dialog/calendar-sync-dialog.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { ToastContainerComponent } from '../../../../shared/components/toast-container/toast-container.component';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../../projects/services/project.service';
import { Project } from '../../../projects/models/project.model';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { map } from 'rxjs/operators';
import { DragDropModule, CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { GoogleChartsModule, ChartType } from 'angular-google-charts';
import { GanttComponent } from '../gantt/gantt.component';
import { take, distinctUntilChanged } from 'rxjs/operators';
import { DashboardComponent } from 'src/app/features/dashboard/dashboard.component';
import { CalendarComponent } from 'src/app/features/calendar/calendar.component';
import { EisenhowerMatrixComponent } from '../eisenhower-matrix/eisenhower-matrix.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { Sort, SortDirection } from '@angular/material/sort';

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
    DragDropModule,
    GoogleChartsModule,
    GanttComponent,
    DashboardComponent,
    CalendarComponent,
    EisenhowerMatrixComponent,
    MatButtonToggleModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'ja-JP' },
    { provide: DateAdapter, useClass: CustomDateAdapter }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TaskListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['select', 'title', 'category', 'importance', 'dueDate', 'actions'];
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
  importanceOptions = ['低', '中', '高'];

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

  importanceOrder = { '高': 3, '中': 2, '低': 1 };
  statusOrder = { '未着手': 1, '進行中': 2, '完了': 3 };

  // デフォルトのカテゴリ選択肢
  defaultCategories = ['技術的課題', '業務フロー', 'バグ修正', '新機能・改善提案'];

  ganttColumns = [
    { type: 'string', label: 'Task ID' },
    { type: 'string', label: 'Task Name' },
    { type: 'string', label: 'Resource' },
    { type: 'date', label: 'Start Date' },
    { type: 'date', label: 'End Date' },
    { type: 'number', label: 'Duration' },
    { type: 'number', label: 'Percent Complete' },
    { type: 'string', label: 'Dependencies' }
  ];

  ganttOptions = {
    height: 400,
    gantt: {
      palette: [
        { color: '#5e97f6', dark: '#2a56c6', light: '#c6dafc' },
        { color: '#db4437', dark: '#a52714', light: '#f4c7c3' },
        { color: '#f2a600', dark: '#ee8100', light: '#fce8b2' }
      ],
      trackHeight: 36,
      barHeight: 24,
      labelStyle: {
        fontName: 'Roboto',
        fontSize: 14,
        color: '#333'
      },
      criticalPathEnabled: false,
      innerGridHorizLine: {
        stroke: '#e0e0e0',
        strokeWidth: 1
      }
    }
  };

  ganttChartType = ChartType.Gantt;

  isTimelineTabActive = false;
  isDashboardTabActive = false;

  quickFilters: string[] = [];
  private quickFilters$ = new BehaviorSubject<string[]>([]);
  filteredTasks$: Observable<Task[]> = of([]);
  currentUserId: string = '';

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
    private projectService: ProjectService
  ) {
    this.searchControl = new FormControl('');
    this.filterForm = this.fb.group({
      category: [''],
      status: [''],
      importance: [''],
      search: this.searchControl
    });
    this.categories$ = this.categoryService.categories$;
  }
  getFilteredTasks(status: string): Observable<Task[]> {
    if (!this.filteredTasks$) {
      return of([]);
    }
    return this.filteredTasks$.pipe(
      map(tasks => {
        // ステータスでフィルタ
        let filtered = tasks.filter(task => task.status === status);
        // ソート条件を取得
        const sort = this.sort;
        if (sort && sort.active && sort.direction !== '') {
          filtered = [...filtered].sort((a, b) => {
            let valueA: any;
            let valueB: any;
            switch (sort.active) {
              case 'title':
                valueA = a.title || '';
                valueB = b.title || '';
                break;
              case 'category':
                valueA = a.category || '';
                valueB = b.category || '';
                break;
              case 'importance':
                valueA = this.importanceOrder[a.importance as keyof typeof this.importanceOrder] || 0;
                valueB = this.importanceOrder[b.importance as keyof typeof this.importanceOrder] || 0;
                break;
              case 'status':
                valueA = this.statusOrder[a.status as keyof typeof this.statusOrder] || 0;
                valueB = this.statusOrder[b.status as keyof typeof this.statusOrder] || 0;
                break;
              case 'dueDate':
                valueA = this.getDateFromTimestamp(a.dueDate);
                valueB = this.getDateFromTimestamp(b.dueDate);
                break;
              default:
                valueA = '';
                valueB = '';
            }
            // 文字列比較
            if (typeof valueA === 'string' && typeof valueB === 'string') {
              const result = valueA.localeCompare(valueB, 'ja');
              return sort.direction === 'asc' ? result : -result;
            }
            // 日付や数値比較
            if (valueA < valueB) return sort.direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return sort.direction === 'asc' ? 1 : -1;
            return 0;
          });
        }
        return filtered;
      })
    );
  }
  ngOnInit(): void {
    this.projectService.loadProjects();

    this.route.params.pipe(
      take(1),
      distinctUntilChanged()
    ).subscribe(async params => {
      const projectId = params['id'];
      if (projectId) {
        const project = await this.projectService.getProject(projectId);
        this.projectName = project?.name || '';
      }
    });

    this.taskService.tasks$.pipe(
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(tasks => {
      this.tasks = tasks;
      this.dataSource.data = tasks;
      this.cdr.detectChanges();
    });

    this.setupFilterForm();

    // すべてのタスクの購読は1か所だけ
    this.subscription = this.taskService.tasks$.pipe(
      distinctUntilChanged((prev, curr) => {
        // タスクの配列が実際に変更された場合のみ更新
        return JSON.stringify(prev) === JSON.stringify(curr);
      })
    ).subscribe(
      (tasks) => {
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

    this.authService.getCurrentUser().then(user => {
      this.currentUserId = user?.uid || '';
      this.filteredTasks$ = combineLatest([
        this.taskService.tasks$,
        this.quickFilters$
      ]).pipe(
        map(([tasks, quickFilters]) => this.filterTasks(tasks, quickFilters))
      );
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    // 重要度・ステータスのカスタムソート
    this.dataSource.sortingDataAccessor = (item, property) => {
      if (property === 'importance') {
        return this.importanceOrder[item.importance as keyof typeof this.importanceOrder] || 0;
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
      const importanceMatch = !filters.importance || data.importance === filters.importance;
      const searchMatch = !searchTerm || 
        (data.title && data.title.toLowerCase().includes(searchTerm)) ||
        (data.description && data.description.toLowerCase().includes(searchTerm));

      return categoryMatch && statusMatch && importanceMatch && searchMatch;
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

  getImportanceClass(importance: string): string {
    switch (importance) {
      case '低':
        return 'importance-low';
      case '中':
        return 'importance-medium';
      case '高':
        return 'importance-high';
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

  // 日付バリデーションの共通関数
  private isDueDateBeforeStartDate(startDate: Date, dueDate: Date): boolean {
    const toYMD = (date: Date) => {
      const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      console.log('Converting to UTC:', {
        original: date.toISOString(),
        utc: utcDate.toISOString()
      });
      return utcDate;
    };
    const startDateYMD = toYMD(startDate);
    const dueDateYMD = toYMD(dueDate);
    console.log('Comparing dates:', {
      startDate: startDateYMD.toISOString(),
      dueDate: dueDateYMD.toISOString(),
      isBefore: dueDateYMD.getTime() < startDateYMD.getTime()
    });
    return dueDateYMD.getTime() < startDateYMD.getTime();
  }

  // 日付の妥当性チェックとバリデーション
  private validateTaskDates(startDate: Date | null, dueDate: Date | null, title: string): { isValid: boolean; error?: { title: string; reason: string } } {
    console.log('Validating dates for task:', {
      title,
      startDate: startDate?.toISOString(),
      dueDate: dueDate?.toISOString()
    });
    const isValidStart = startDate instanceof Date && !isNaN(startDate.getTime());
    const isValidDue = dueDate instanceof Date && !isNaN(dueDate.getTime());
    if (!isValidStart || !isValidDue) {
      console.log('Invalid dates:', { isValidStart, isValidDue });
      return { isValid: false };
    }
    if (this.isDueDateBeforeStartDate(startDate, dueDate)) {
      console.log('Due date is before start date');
      return {
        isValid: false,
        error: { title, reason: '開始日より前の期限' }
      };
    }
    console.log('Dates are valid');
    return { isValid: true };
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
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

  async importAsanaCSV(file: File): Promise<void> {
    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(','));
      const headers = rows[0];

      const errorTasks: { title: string; reason: string }[] = [];
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

        // 日付の取得とバリデーション
        const startDateStr = row[headers.indexOf('Start Date')] || row[headers.indexOf('開始日')];
        const dueDateStr = row[headers.indexOf('Due Date')];
        
        console.log(`Asana import - Task: ${row[headers.indexOf('Name')]}`);
        console.log(`Start date string: ${startDateStr}`);
        console.log(`Due date string: ${dueDateStr}`);
        
        const startDate = startDateStr ? new Date(startDateStr) : new Date();
        const dueDate = dueDateStr ? new Date(dueDateStr) : null;

        console.log(`Parsed dates - Start: ${startDate.toISOString()}, Due: ${dueDate?.toISOString()}`);

        const validation = this.validateTaskDates(startDate, dueDate, row[headers.indexOf('Name')]);
        console.log(`Validation result for ${row[headers.indexOf('Name')]}:`, validation);
        
        if (!validation.isValid) {
          if (validation.error) {
            console.log(`Validation error for ${row[headers.indexOf('Name')]}:`, validation.error);
            errorTasks.push(validation.error);
          }
        }

        const taskData: Omit<Task, 'id'> = {
          title: row[headers.indexOf('Name')] || '',
          description: row[headers.indexOf('Notes')] || '',
          status: status,
          importance: row[headers.indexOf('重要度')] as '低' | '中' | '高' || '中',
          category: 'Asana',
          assignedTo: row[headers.indexOf('Assignee')] || '',
          dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
          userId: '',
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          completed: row[headers.indexOf('完了')] === '完了' || false,
          startDate: startDate,
          duration: dueDate && startDate ? Math.max(1, Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) : 1
        };
        return taskData;
      });

      console.log('Asana import - Error tasks:', errorTasks);
      console.log('Asana import - Total tasks to import:', tasks.length);

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

      if (errorTasks.length > 0) {
        this.snackBar.open(`${errorTasks.length}件のタスクで日付不正がありました。編集画面で期限を修正してください。`, '閉じる', { duration: 9000 });
        setTimeout(() => {
          this.snackBar.open(`${successCount}件のタスクをインポートしました`, '閉じる', { duration: 3000 });
        }, 9000);
      } else {
        this.snackBar.open(`${successCount}件のタスクをインポートしました`, '閉じる', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error importing Asana CSV:', error);
      this.snackBar.open('Asana CSVのインポートに失敗しました', '閉じる', {
        duration: 3000
      });
    }
  }

  async importTrelloCSV(file: File): Promise<void> {
    console.log('importTrelloCSV called');
    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
      const headers = rows[0];

      const errorTasks: { title: string; reason: string }[] = [];
      const tasks = rows.slice(1).map(row => {
        const title = row[headers.indexOf('Card Name')]?.trim() || '';
        if (!title) return null;

        const trelloStatus = row[headers.indexOf('List Name')] || '';
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

        // 日付の取得とバリデーション
        const startDateStr = row[headers.indexOf('Start Date')] || row[headers.indexOf('開始日')];
        const dueDateStr = row[headers.indexOf('Due Date')];
        
        console.log(`Trello import - Task: ${title}`);
        console.log(`Start date string: ${startDateStr}`);
        console.log(`Due date string: ${dueDateStr}`);
        
        const startDate = startDateStr ? new Date(startDateStr) : new Date();
        const dueDate = dueDateStr ? new Date(dueDateStr) : null;

        console.log(`Parsed dates - Start: ${startDate.toISOString()}, Due: ${dueDate?.toISOString()}`);

        const validation = this.validateTaskDates(startDate, dueDate, title);
        console.log(`Validation result for ${title}:`, validation);
        
        if (!validation.isValid) {
          if (validation.error) {
            console.log(`Validation error for ${title}:`, validation.error);
            errorTasks.push(validation.error);
          }
        }

        const assignedTo = headers.indexOf('Member Names') !== -1 && row[headers.indexOf('Member Names')]
          ? row[headers.indexOf('Member Names')].trim()
          : row[headers.indexOf('Members')]?.trim() || '';

        const taskData = {
          title: title,
          description: row[headers.indexOf('Card Description')]?.trim() || '',
          status: status,
          importance: '中' as '低' | '中' | '高', // デフォルト値を設定
          category: 'Trello',
          assignedTo: assignedTo,
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          userId: '',
          dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
          completed: row[headers.indexOf('完了')] === '完了' || false,
          startDate: startDate,
          duration: dueDate && startDate ? Math.max(1, Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) : 1
        } as const;
        return taskData;
      }).filter(task => task !== null);

      console.log('Trello import - Error tasks:', errorTasks);
      console.log('Trello import - Total tasks to import:', tasks.length);

      let successCount = 0;
      for (const task of tasks) {
        try {
          await this.taskService.createTask(task as Task);
          successCount++;
        } catch (error) {
          console.error('Error creating task:', error);
          this.snackBar.open(`タスクの作成に失敗しました: ${(task as any).title}`, '閉じる', {
            duration: 3000
          });
        }
      }

      if (errorTasks.length > 0) {
        this.snackBar.open(`${errorTasks.length}件のタスクで日付不正がありました。編集画面で期限を修正してください。`, '閉じる', { duration: 9000 });
        setTimeout(() => {
          this.snackBar.open(`${successCount}件のタスクをインポートしました`, '閉じる', { duration: 3000 });
        }, 9000);
      } else {
        this.snackBar.open(`${successCount}件のタスクをインポートしました`, '閉じる', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error importing Trello CSV:', error);
      this.snackBar.open('Trello CSVのインポートに失敗しました', '閉じる', {
        duration: 3000
      });
    }
  }

  async importSampleCSV(file: File): Promise<void> {
    console.log('importSampleCSV called');
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(header => header.trim());
      const errorTasks: { title: string; reason: string }[] = [];
      const importDate = new Date();
      const tasks = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(value => value.trim());
        const title = values[headers.indexOf('タイトル')] || '';
        if (!title.trim()) continue;
        const startDateStr = values[headers.indexOf('開始日')] || values[headers.indexOf('startDate')];
        const dueDateStr = values[headers.indexOf('期限')];
        console.log(`row ${i}:`, values);
        console.log(`row ${i} startDateStr:`, startDateStr, 'dueDateStr:', dueDateStr);
        const startDate = startDateStr ? new Date(startDateStr) : importDate;
        const dueDate = dueDateStr ? new Date(dueDateStr) : null;
        console.log('Processing task:', {
          title,
          startDate: startDate.toISOString(),
          dueDate: dueDate?.toISOString(),
          importDate: importDate.toISOString()
        });
        const validation = this.validateTaskDates(startDate, dueDate, title);
        console.log('Validation result:', validation);
        if (!validation.isValid && validation.error) {
          console.log('Validation failed:', validation.error);
          errorTasks.push(validation.error);
        }
        // バリデーションに関係なく全てpush
        const task: Omit<Task, 'id'> = {
          title: title,
          description: values[headers.indexOf('説明')] || '',
          status: (values[headers.indexOf('ステータス')] as '未着手' | '進行中' | '完了') || '未着手',
          importance: (values[headers.indexOf('重要度')] as '低' | '中' | '高') || '中',
          category: values[headers.indexOf('カテゴリ')] || '',
          assignedTo: values[headers.indexOf('担当者')] || '',
          dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
          userId: 'user1',
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          completed: values[headers.indexOf('完了')] === '完了' || false,
          startDate: startDate,
          duration: dueDate && startDate ? Math.max(1, Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) : 1
        };
        tasks.push(task);
      }
      console.log('Import summary:', {
        totalTasks: tasks.length,
        errorTasks: errorTasks.length,
        errors: errorTasks
      });
      let successCount = 0;
      for (const task of tasks) {
        try {
          await this.taskService.createTask(task);
          successCount++;
        } catch (error) {
          console.error('タスクの作成に失敗しました:', error);
        }
      }
      if (errorTasks.length > 0) {
        this.snackBar.open(`${errorTasks.length}件のタスクで日付不正がありました。編集画面で期限を修正してください。`, '閉じる', { duration: 9000 });
        setTimeout(() => {
          this.snackBar.open(`${successCount}件のタスクをインポートしました`, '閉じる', { duration: 3000 });
        }, 9000);
      } else {
        this.snackBar.open(`${successCount}件のタスクをインポートしました`, '閉じる', { duration: 3000 });
      }
    } catch (error) {
      console.error('CSVインポートエラー:', error);
      this.snackBar.open('CSVのインポートに失敗しました', '閉じる', { duration: 3000 });
    }
  }

  getTasksByStatus(status: string): Task[] {
    return this.dataSource.data.filter(task => task.status === status);
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

  get ganttItems() {
    return this.tasks.map(task => ({
      id: task.id,
      title: task.title,
      start: task.dueDate ? this.getDateFromTimestamp(task.dueDate) : new Date(),
      end: task.dueDate ? this.getDateFromTimestamp(task.dueDate) : new Date(),
      color: '#1976d2'
    }));
  }

  onTabChange(event: any) {
    const previousTimelineState = this.isTimelineTabActive;
    this.isTimelineTabActive = event.index === 2; // タイムラインタブのインデックスを修正
    this.isDashboardTabActive = event.index === 3;

    // タイムラインタブが選択された場合、データを再読み込み
    if (this.isTimelineTabActive) {
      // タスクデータが空の場合のみ再読み込み
      if (this.tasks.length === 0) {
        this.loadTasks();
      }
    }
  }

  async onGanttTaskUpdate(updatedTask: any) {
    try {
      await this.taskService.updateTask(updatedTask.id, {
        title: updatedTask.title,
        startDate: updatedTask.startDate,
        duration: updatedTask.duration,
        dueDate: updatedTask.dueDate
      });
      this.snackBar.open('タスクを更新しました', '閉じる', { duration: 3000 });
    } catch (error) {
      console.error('タスクの更新に失敗しました:', error);
      this.snackBar.open('タスクの更新に失敗しました', '閉じる', { duration: 3000 });
    }
  }

  clearFilters() {
    this.quickFilters = [];
    this.quickFilters$.next([]);
    this.applyFilters();
  }

  onQuickFilterChange() {
    this.quickFilters$.next(this.quickFilters);
    this.applyFilters();
  }

  filterTasks(tasks: Task[], quickFilters: string[]): Task[] {
    let filtered = tasks;
    if (quickFilters.includes('incomplete')) {
      filtered = filtered.filter(t => t.status !== '完了');
    }
    if (quickFilters.includes('complete')) {
      filtered = filtered.filter(t => t.status === '完了');
    }
    // mineフィルターは非同期不要にするため、ユーザーIDをngOnInitで取得しておく
    if (quickFilters.includes('mine') && this.currentUserId) {
      filtered = filtered.filter(t => t.assignedTo === this.currentUserId);
    }
    if (quickFilters.includes('thisWeek')) {
      const now = new Date();
      const weekEnd = new Date();
      weekEnd.setDate(now.getDate() + (7 - now.getDay()));
      filtered = filtered.filter(t => {
        const due = this.getDateFromTimestamp(t.dueDate);
        return due >= now && due <= weekEnd;
      });
    }
    if (quickFilters.includes('nextWeek')) {
      const now = new Date();
      const weekStart = new Date();
      weekStart.setDate(now.getDate() + (7 - now.getDay()) + 1);
      const weekEnd = new Date();
      weekEnd.setDate(weekStart.getDate() + 6);
      filtered = filtered.filter(t => {
        const due = this.getDateFromTimestamp(t.dueDate);
        return due >= weekStart && due <= weekEnd;
      });
    }
    return filtered;
  }

  // 期限が不正かどうかを判定するメソッド
  isInvalidDueDate(task: Task): boolean {
    // 期限が未設定の場合は赤字表示
    if (!task.dueDate) return true;
    
    // 開始日が未設定の場合は赤字表示しない
    if (!task.startDate) return false;
    
    const dueDate = this.getDateFromTimestamp(task.dueDate);
    const startDate = this.getDateFromTimestamp(task.startDate);
    
    // 日付が不正な場合は赤字表示
    if (isNaN(dueDate.getTime()) || isNaN(startDate.getTime())) return true;
    
    // 今日の日付（UTC 0時）
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    
    // dueDateが今日と同じ場合は赤字にしない
    if (dueDate.getTime() === todayUTC.getTime()) return false;
    
    // 開始日より前の期限の場合は赤字表示
    return dueDate.getTime() < startDate.getTime();
  }
  

  exportTasks(): void {
    const tasks = this.tasks.map(task => ({
      タイトル: task.title,
      説明: task.description || '',
      ステータス: task.status,
      重要度: task.importance,
      カテゴリ: task.category || '',
      担当者: task.assignedTo || '',
      開始日: task.startDate ? this.getDateFromTimestamp(task.startDate).toISOString().split('T')[0] : '',
      期限: task.dueDate ? this.getDateFromTimestamp(task.dueDate).toISOString().split('T')[0] : '',
      完了: task.completed ? '完了' : ''
    }));

    const csvContent = this.convertToCSV(tasks);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tasks_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private convertToCSV(data: any[]): string {
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(header => obj[header]));
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  async exportToCSV(): Promise<void> {
    try {
      const tasks = await this.taskService.getTasks();
      const headers = ['タイトル', '説明', 'ステータス', '重要度', 'カテゴリ', '担当者', '期限'];
      const rows = tasks.map(task => [
        task.title,
        task.description,
        task.status,
        task.importance,
        task.category,
        task.assignedTo,
        task.dueDate instanceof Date ? task.dueDate.toLocaleDateString() : 
          (typeof task.dueDate === 'object' && task.dueDate && 'seconds' in task.dueDate) ? 
            new Date(task.dueDate.seconds * 1000).toLocaleDateString() : ''
      ]);
      const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tasks.csv';
      a.click();
      URL.revokeObjectURL(url);
      this.snackBar.open('CSVファイルをエクスポートしました', '閉じる', { duration: 3000 });
    } catch (error) {
      console.error('CSVのエクスポートに失敗しました:', error);
      this.snackBar.open('CSVのエクスポートに失敗しました', '閉じる', { duration: 3000 });
    }
  }

  async exportToExcel(): Promise<void> {
    try {
      const tasks = await this.taskService.getTasks();
      const headers = ['タイトル', '説明', 'ステータス', '重要度', 'カテゴリ', '担当者', '期限'];
      const rows = tasks.map(task => [
        task.title,
        task.description,
        task.status,
        task.importance,
        task.category,
        task.assignedTo,
        task.dueDate instanceof Date ? task.dueDate.toLocaleDateString() : 
          (typeof task.dueDate === 'object' && task.dueDate && 'seconds' in task.dueDate) ? 
            new Date(task.dueDate.seconds * 1000).toLocaleDateString() : ''
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
      this.snackBar.open('Excelファイルをエクスポートしました', '閉じる', { duration: 3000 });
    } catch (error) {
      console.error('Excelのエクスポートに失敗しました:', error);
      this.snackBar.open('Excelのエクスポートに失敗しました', '閉じる', { duration: 3000 });
    }
  }

  downloadSampleCSV(): void {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(today.getDate() + 2);
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() + 7);

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    const sampleData = [
      ['タイトル', '説明', 'ステータス', '重要度', 'カテゴリ', '担当者', '期限'],
      ['タスク1', 'サンプルタスク1の説明', '未着手', '高', '技術的課題', '山田太郎', formatDate(twoDaysAgo)],
      ['タスク2', 'サンプルタスク2の説明', '進行中', '中', '業務フロー', '鈴木花子', formatDate(today)],
      ['タスク3', 'サンプルタスク3の説明', '完了', '低', '新機能・改善提案', '佐藤一郎', formatDate(twoDaysLater)],
      ['タスク4', 'サンプルタスク4の説明', '未着手', '高', 'バグ修正', '田中次郎', formatDate(oneWeekLater)],
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_tasks.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.snackBar.open('サンプルCSVファイルをダウンロードしました', '閉じる', { duration: 3000 });
  }

} 