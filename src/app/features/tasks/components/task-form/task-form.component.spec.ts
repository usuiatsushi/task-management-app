import { ComponentFixture, TestBed, fakeAsync, tick, flush, flushMicrotasks, discardPeriodicTasks } from '@angular/core/testing';
import { TaskFormComponent } from './task-form.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category.service';
import { CalendarService } from '../../services/calendar.service';
import { MatDialog } from '@angular/material/dialog';
import { ProjectService } from '../../../projects/services/project.service';
import { UserService } from 'src/app/features/auth/services/user.service';
import { of, BehaviorSubject } from 'rxjs';
import { Task } from '../../models/task.model';
import { Timestamp } from '@angular/fire/firestore';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from '../../../../../environments/environment';

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

class FirestoreMock {
  doc() { return this; }
  get() { return Promise.resolve({ exists: true, data: () => mockTask }); }
  set() { return Promise.resolve(); }
  update() { return Promise.resolve(); }
}

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;
  let taskServiceSpy: jasmine.SpyObj<TaskService>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let calendarServiceSpy: jasmine.SpyObj<CalendarService>;
  let projectServiceSpy: jasmine.SpyObj<ProjectService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let routeParams: BehaviorSubject<any>;

  beforeEach(async () => {
    routeParams = new BehaviorSubject({ id: null });

    taskServiceSpy = jasmine.createSpyObj('TaskService', ['createTask', 'updateTask']);
    categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['addCategory', 'deleteCategory'], {
      categories$: of(['開発', 'テスト', 'デザイン'])
    });
    categoryServiceSpy.addCategory.and.returnValue(Promise.resolve());
    categoryServiceSpy.deleteCategory.and.returnValue(Promise.resolve());

    calendarServiceSpy = jasmine.createSpyObj('CalendarService', ['syncWithCalendar']);
    projectServiceSpy = jasmine.createSpyObj('ProjectService', ['getProjects'], {
      getProjects: of([])
    });
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      url: '/tasks/new'
    });
    userServiceSpy = jasmine.createSpyObj('UserService', ['getAllUsers'], {
      getAllUsers: () => Promise.resolve([
        { id: 'user1', name: 'ユーザー1' },
        { id: 'user2', name: 'ユーザー2' }
      ])
    });

    await TestBed.configureTestingModule({
      imports: [
        TaskFormComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        MatSnackBarModule,
        MatDividerModule,
        MatIconModule,
        MatTooltipModule,
        MatDialogModule,
        MatCheckboxModule,
        HttpClientTestingModule,
        AngularFireModule.initializeApp(environment.firebase)
      ],
      providers: [
        FormBuilder,
        { provide: Firestore, useClass: FirestoreMock },
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: CalendarService, useValue: calendarServiceSpy },
        { provide: ProjectService, useValue: projectServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
        { provide: UserService, useValue: userServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: routeParams,
            snapshot: {
              paramMap: {
                get: () => null
              }
            }
          }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.taskForm.get('title')?.value).toBe('');
    expect(component.taskForm.get('status')?.value).toBe('未着手');
    expect(component.taskForm.get('importance')?.value).toBe('中');
    expect(component.taskForm.get('urgent')?.value).toBe(false);
  });

  it('should validate required fields', () => {
    const form = component.taskForm;
    expect(form.valid).toBeFalsy();
    expect(form.get('title')?.errors?.['required']).toBeTruthy();

    form.get('title')?.setValue('テストタスク');
    expect(form.valid).toBeTruthy();
  });

  it('should load task in edit mode', fakeAsync(() => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap as any).get = () => '1';
    component.ngOnInit();
    flushMicrotasks();
    tick(0);
    flushMicrotasks();
    tick(1000);
    fixture.detectChanges();
    expect(component.isEditMode).toBeTruthy();
    expect(component.taskForm.get('title')?.value).toBe('テストタスク');
  }));

  it('should save task', fakeAsync(() => {
    const form = component.taskForm;
    form.patchValue({
      title: '新しいタスク',
      description: '説明',
      status: '進行中',
      importance: '高',
      category: '開発',
      assignedTo: 'ユーザー1',
      dueDate: new Date(),
      urgent: true
    });
    component.taskForm.markAllAsTouched();
    fixture.detectChanges();
    component.saveTask();
    flushMicrotasks();
    tick(0);
    flushMicrotasks();
    tick(1000);
    fixture.detectChanges();
    expect(taskServiceSpy.createTask).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'タスクを保存しました',
      '閉じる',
      jasmine.any(Object)
    );
  }));

  it('should add new category', fakeAsync(() => {
    const newCategory = '新しいカテゴリ';
    component.taskForm.get('newCategoryName')?.setValue(newCategory);
    fixture.detectChanges();
    component.addNewCategory();
    flush();
    flushMicrotasks();
    tick(0);
    flushMicrotasks();
    tick(1000);
    fixture.detectChanges();
    expect(categoryServiceSpy.addCategory).toHaveBeenCalledWith(newCategory);
    expect(component.taskForm.get('category')?.value).toBe(newCategory);
    discardPeriodicTasks();
  }));

  it('should delete category', fakeAsync(() => {
    const category = '開発';
    component.deleteCategory(category);
    tick(1000); // タイマーを十分進める
    fixture.detectChanges();
    expect(categoryServiceSpy.deleteCategory).toHaveBeenCalledWith(category);
  }));

  it('should handle online status changes', fakeAsync(() => {
    const onLineSpy = spyOnProperty(navigator, 'onLine', 'get');
    fixture.detectChanges();
    component.ngOnInit();
    // オフライン状態をシミュレート
    onLineSpy.and.returnValue(false);
    window.dispatchEvent(new Event('offline'));
    tick(1000);
    flushMicrotasks();
    fixture.detectChanges();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'オフライン状態です。インターネット接続を確認してください。',
      '閉じる',
      jasmine.any(Object)
    );
    // オンライン状態をシミュレート
    onLineSpy.and.returnValue(true);
    window.dispatchEvent(new Event('online'));
    tick(1000);
    flushMicrotasks();
    fixture.detectChanges();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'オンラインに復帰しました。',
      '閉じる',
      jasmine.any(Object)
    );
  }));
}); 