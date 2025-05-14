import { ComponentFixture, TestBed, fakeAsync, tick, flush, flushMicrotasks } from '@angular/core/testing';
import { TaskListComponent } from './task-list.component';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_FORMATS, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CalendarService } from '../../services/calendar.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ProjectService } from '../../../projects/services/project.service';
import { of, BehaviorSubject } from 'rxjs';
import { Task } from '../../models/task.model';
import { Timestamp } from '@angular/fire/firestore';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { GoogleChartsModule } from 'angular-google-charts';
import { ToastContainerComponent } from '../../../../shared/components/toast-container/toast-container.component';
import { GanttComponent } from '../gantt/gantt.component';
import { DashboardComponent } from 'src/app/features/dashboard/dashboard.component';
import { CalendarComponent } from 'src/app/features/calendar/calendar.component';
import { EisenhowerMatrixComponent } from '../eisenhower-matrix/eisenhower-matrix.component';

const mockTask: Task = {
  id: '1',
  title: 'テストタスク',
  description: 'テストタスクの説明',
  status: '未着手',
  importance: '高',
  urgent: true,
  category: '開発',
  assignedTo: 'ユーザー1',
  dueDate: Timestamp.fromDate(new Date('2024-12-31')),
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  userId: 'user1',
  completed: false,
  progress: 0,
  subTasks: []
};

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let taskServiceSpy: jasmine.SpyObj<TaskService>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let calendarServiceSpy: jasmine.SpyObj<CalendarService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let projectServiceSpy: jasmine.SpyObj<ProjectService>;

  beforeEach(async () => {
    taskServiceSpy = jasmine.createSpyObj('TaskService', ['getTasks', 'updateTask', 'deleteTask']);
    categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories'], {
      categories$: of(['開発', 'テスト', 'デザイン'])
    });
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showNotification']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser'], {
      currentUser$: of({ id: 'user1', name: 'ユーザー1' })
    });
    calendarServiceSpy = jasmine.createSpyObj('CalendarService', ['syncWithCalendar']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['show']);
    projectServiceSpy = jasmine.createSpyObj('ProjectService', ['getProject'], {
      getProject: of({ id: '1', name: 'テストプロジェクト' })
    });

    taskServiceSpy.getTasks.and.returnValue(Promise.resolve([mockTask]));

    await TestBed.configureTestingModule({
      imports: [
        TaskListComponent,
        NoopAnimationsModule,
        RouterTestingModule,
        ReactiveFormsModule,
        FormsModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatDialogModule,
        MatSnackBarModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatCheckboxModule,
        MatMenuModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonToggleModule,
        MatTabsModule,
        DragDropModule,
        GoogleChartsModule,
        ToastContainerComponent,
        GanttComponent,
        DashboardComponent,
        CalendarComponent,
        EisenhowerMatrixComponent
      ],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: CalendarService, useValue: calendarServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ProjectService, useValue: projectServiceSpy },
        { provide: MAT_DATE_FORMATS, useValue: {
          parse: { dateInput: 'yyyy/MM/dd' },
          display: { dateInput: 'yyyy/MM/dd', monthYearLabel: 'yyyy年MM月' }
        }},
        { provide: MAT_DATE_LOCALE, useValue: 'ja-JP' }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tasks on init', fakeAsync(() => {
    component.ngOnInit();
    tick();
    flushMicrotasks();
    fixture.detectChanges();

    expect(taskServiceSpy.getTasks).toHaveBeenCalled();
    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].title).toBe('テストタスク');
  }));

  it('should filter tasks by search term', fakeAsync(() => {
    component.ngOnInit();
    tick();
    flushMicrotasks();
    fixture.detectChanges();

    component.searchControl.setValue('テスト');
    component.applyFilters();
    tick();
    fixture.detectChanges();

    expect(component.dataSource.filteredData.length).toBe(1);
    expect(component.dataSource.filteredData[0].title).toBe('テストタスク');
  }));

  it('should toggle task selection', fakeAsync(() => {
    component.ngOnInit();
    tick();
    flushMicrotasks();
    fixture.detectChanges();

    const task = { ...mockTask };
    component.toggleTaskSelection(task as any);
    expect(component.selectedTasks.length).toBe(1);
    expect(component.selectedTasks[0]).toBe(task);

    component.toggleTaskSelection(task as any);
    expect(component.selectedTasks.length).toBe(0);
  }));

  it('should delete task', fakeAsync(() => {
    taskServiceSpy.deleteTask.and.returnValue(Promise.resolve());
    
    component.ngOnInit();
    tick();
    flushMicrotasks();
    fixture.detectChanges();

    const task = { ...mockTask };
    component.deleteTask(task as any, new Event('click'));
    tick();
    flushMicrotasks();
    fixture.detectChanges();

    expect(taskServiceSpy.deleteTask).toHaveBeenCalledWith(task);
  }));

  it('should update task field', fakeAsync(() => {
    taskServiceSpy.updateTask.and.returnValue(Promise.resolve());
    
    component.ngOnInit();
    tick();
    flushMicrotasks();
    fixture.detectChanges();

    const task = { ...mockTask };
    component.startEditing(task as any, 'title');
    component.updateTaskField(task as any, 'title', '更新されたタスク');
    tick();
    flushMicrotasks();
    fixture.detectChanges();

    expect(taskServiceSpy.updateTask).toHaveBeenCalled();
  }));

  it('should handle task drop', fakeAsync(() => {
    taskServiceSpy.updateTask.and.returnValue(Promise.resolve());
    
    component.ngOnInit();
    tick();
    flushMicrotasks();
    fixture.detectChanges();

    const task = { ...mockTask };
    const event = {
      previousIndex: 0,
      currentIndex: 0,
      item: { data: task },
      container: { data: [task] },
      previousContainer: { data: [task] }
    };

    component.onTaskDrop(event as any, '進行中');
    tick();
    flushMicrotasks();
    fixture.detectChanges();

    expect(taskServiceSpy.updateTask).toHaveBeenCalled();
  }));
}); 