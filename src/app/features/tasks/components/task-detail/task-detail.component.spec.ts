import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskDetailComponent } from './task-detail.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore } from '@angular/fire/firestore';
import { TaskService } from '../../services/task.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { Task, SubTask } from '../../models/task.model';
import { Timestamp } from '@angular/fire/firestore';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../../../../../environments/environment';

class FirestoreMock {
  deleteDoc() { return Promise.resolve(); }
}

describe('TaskDetailComponent', () => {
  let component: TaskDetailComponent;
  let fixture: ComponentFixture<TaskDetailComponent>;
  let taskServiceSpy: jasmine.SpyObj<TaskService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;

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

  beforeEach(async () => {
    taskServiceSpy = jasmine.createSpyObj('TaskService', ['updateTask']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        TaskDetailComponent,
        NoopAnimationsModule,
        ReactiveFormsModule
        // 必要な他のモジュール
      ],
      providers: [
        { provide: Firestore, useClass: FirestoreMock },
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1'
              }
            }
          }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load task on init', fakeAsync(() => {
    spyOn(component as any, 'loadTask').and.callFake(async (taskId: string) => {
      component.task = { ...mockTask };
    });

    component.ngOnInit();
    tick();
    expect(component.task).toBeTruthy();
    expect(component.task?.title).toBe('テストタスク');
  }));

  it('should delete task when confirmed', fakeAsync(() => {
    const dialogRef = {
      afterClosed: () => of(true),
      componentInstance: {
        data: {
          title: 'タスクの削除',
          message: '「テストタスク」を削除してもよろしいですか？',
          confirmText: '削除',
          cancelText: 'キャンセル'
        }
      }
    };
    dialogSpy.open.and.returnValue(dialogRef as any);

    component.task = { ...mockTask };
    component.deleteTask();
    tick();

    expect(dialogSpy.open).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tasks']);
  }));

  it('should update progress when slider changes', () => {
    component.task = { ...mockTask };
    component.onSliderChange(50, mockTask);
    expect(taskServiceSpy.updateTask).toHaveBeenCalledWith(mockTask.id, { progress: 50 });
  });

  it('should add sub task', () => {
    component.task = { ...mockTask };
    component.newSubTaskTitle = '新しいサブタスク';
    component.newSubTaskAssignee = 'ユーザー2';
    component.addSubTask();

    expect(component.task?.subTasks?.length).toBe(1);
    expect(component.task?.subTasks?.[0].title).toBe('新しいサブタスク');
    expect(taskServiceSpy.updateTask).toHaveBeenCalled();
  });

  it('should remove sub task', () => {
    const subTask: SubTask = {
      id: '1',
      title: 'サブタスク',
      assignee: 'ユーザー1',
      done: false
    };
    component.task = { ...mockTask, subTasks: [subTask] };
    component.removeSubTask(subTask);

    expect(component.task?.subTasks?.length).toBe(0);
    expect(taskServiceSpy.updateTask).toHaveBeenCalled();
  });

  it('should show deadline reminder when due date is within 7 days', fakeAsync(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    component.task = {
      ...mockTask,
      dueDate: tomorrow // Date型で渡す
    };
    fixture.detectChanges();
    component.checkDeadlineReminder();
    tick(5000); // タイマーを十分進める

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      '締め切りまであと1日です',
      '閉じる',
      jasmine.any(Object)
    );
  }));

  it('should get correct status label', () => {
    expect(component.getStatusLabel('todo')).toBe('未着手');
    expect(component.getStatusLabel('in_progress')).toBe('進行中');
    expect(component.getStatusLabel('done')).toBe('完了');
  });
});

describe('TaskDetailComponent Integration', () => {
  let component: TaskDetailComponent;
  let fixture: ComponentFixture<TaskDetailComponent>;
  let taskService: jasmine.SpyObj<TaskService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockTask: Task = {
    id: 'test-task-id',
    title: 'テストタスク',
    description: 'テスト説明',
    status: '未着手',
    importance: '中',
    category: 'テスト',
    assignedTo: 'テストユーザー',
    dueDate: Timestamp.fromDate(new Date()),
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
    progress: 0,
    userId: 'test-user-id',
    completed: false
  };

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', ['getTask', 'updateTask', 'deleteTask']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [TaskDetailComponent],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'test-task-id'
              }
            }
          }
        },
        {
          provide: Firestore,
          useValue: {}
        }
      ]
    }).compileComponents();

    taskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    taskService.getTask.and.returnValue(Promise.resolve(mockTask));
    taskService.updateTask.and.returnValue(Promise.resolve());
    taskService.deleteTask.and.returnValue(Promise.resolve());

    fixture = TestBed.createComponent(TaskDetailComponent);
    component = fixture.componentInstance;
  });

  it('should load task data on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.task).toBeTruthy();
    expect(component.task?.id).toBe('test-task-id');
    expect(component.task?.title).toBe('テストタスク');
  }));

  it('should update task status to 進行中 and set progress to 50%', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.updateTaskStatus('進行中');
    tick();

    expect(taskService.updateTask).toHaveBeenCalledWith('test-task-id', jasmine.objectContaining({
      status: '進行中',
      progress: 50
    }));
    expect(component.task?.progress).toBe(50);
    expect(snackBar.open).toHaveBeenCalledWith('タスクのステータスを更新しました', '閉じる', { duration: 3000 });
  }));

  it('should update task status to 完了 and set progress to 100%', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.updateTaskStatus('完了');
    tick();

    expect(taskService.updateTask).toHaveBeenCalledWith('test-task-id', jasmine.objectContaining({
      status: '完了',
      progress: 100
    }));
    expect(component.task?.progress).toBe(100);
    expect(snackBar.open).toHaveBeenCalledWith('タスクのステータスを更新しました', '閉じる', { duration: 3000 });
  }));

  it('should handle task deletion', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const dialogRef = { afterClosed: () => of(true) };
    const dialog = TestBed.inject(MatDialog);
    (dialog.open as jasmine.Spy).and.returnValue(dialogRef);

    component.deleteTask();
    tick();

    expect(taskService.deleteTask).toHaveBeenCalledWith('test-task-id');
    expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
    expect(snackBar.open).toHaveBeenCalledWith('タスクを削除しました', '閉じる', { duration: 3000 });
  }));

  it('should update progress when slider value changes', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const newProgress = 75;
    component.onSliderChange(newProgress, mockTask);
    tick();

    expect(taskService.updateTask).toHaveBeenCalledWith('test-task-id', { progress: newProgress });
  }));

  it('should handle sub-task operations', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    // サブタスクの追加
    component.newSubTaskTitle = '新しいサブタスク';
    component.newSubTaskAssignee = '担当者';
    component.addSubTask();
    tick();

    expect(taskService.updateTask).toHaveBeenCalledWith('test-task-id', jasmine.objectContaining({
      subTasks: jasmine.any(Array)
    }));

    // サブタスクの更新
    if (component.task?.subTasks && component.task.subTasks.length > 0) {
      const subTask = component.task.subTasks[0];
      subTask.done = true;
      component.updateSubTask(subTask);
      tick();

      expect(taskService.updateTask).toHaveBeenCalledWith('test-task-id', {
        subTasks: component.task.subTasks
      });
    }
  }));

  it('should handle error cases', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    // エラーケースのテスト
    taskService.updateTask.and.returnValue(Promise.reject('Error'));

    component.updateTaskStatus('進行中');
    tick();

    expect(snackBar.open).toHaveBeenCalledWith('タスクのステータス更新に失敗しました', '閉じる', { duration: 3000 });
  }));
}); 