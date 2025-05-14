import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProjectListComponent } from './project-list.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { TaskService } from 'src/app/features/tasks/services/task.service';
import { of, Subject } from 'rxjs';
import { Project } from '../../models/project.model';
import { Task } from 'src/app/features/tasks/models/task.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Timestamp } from '@angular/fire/firestore';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { MatDialogModule } from '@angular/material/dialog';
import { Injectable } from '@angular/core';

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'テストプロジェクト1',
    description: 'テスト説明1',
    members: ['user1'],
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
    userId: 'user1',
    tasks: []
  },
  {
    id: '2',
    name: 'テストプロジェクト2',
    description: 'テスト説明2',
    members: ['user2'],
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
    userId: 'user2',
    tasks: []
  }
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'タスク1',
    description: 'タスク説明1',
    status: '未着手',
    dueDate: Timestamp.fromDate(new Date()),
    projectId: '1',
    assignedTo: 'user1',
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
    importance: '中',
    category: '開発',
    userId: 'user1',
    completed: false
  },
  {
    id: '2',
    title: 'タスク2',
    description: 'タスク説明2',
    status: '進行中',
    dueDate: Timestamp.fromDate(new Date()),
    projectId: '1',
    assignedTo: 'user2',
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
    importance: '高',
    category: 'テスト',
    userId: 'user2',
    completed: false
  }
];

@Injectable()
class MockMatDialog extends MatDialog {
  _openDialogs: MatDialogRef<any>[] = [];
  _afterAllClosed = new Subject<void>();
  _afterOpened = new Subject<MatDialogRef<any>>();
  _lastAfterClosed = new Subject<boolean>();

  override open = jasmine.createSpy('open').and.callFake((component: any, config?: any) => {
    console.log('MockMatDialog.openが呼び出されました', { component, config });
    const dialogRef = {
      afterClosed: () => this._lastAfterClosed.asObservable(),
      close: () => {
        this._lastAfterClosed.next(false);
        this._lastAfterClosed.complete();
      },
      backdropClick: () => of(null),
      keydownEvents: () => of(null),
      beforeClosed: () => of(null),
      disableClose: false,
      id: `mock-dialog-${Date.now()}`,
      componentInstance: {},
      updatePosition: () => dialogRef,
      updateSize: () => dialogRef
    } as unknown as MatDialogRef<any>;

    this._openDialogs.push(dialogRef);
    this._afterOpened.next(dialogRef);
    return dialogRef;
  });

  getLastAfterClosed(): Subject<boolean> {
    return this._lastAfterClosed;
  }
}

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let taskService: jasmine.SpyObj<TaskService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let router: jasmine.SpyObj<Router>;
  let dialog: MatDialog;
  let afterClosedSubject: Subject<boolean>;

  beforeEach(async () => {
    console.log('テストのセットアップを開始します');
    afterClosedSubject = new Subject<boolean>();
    const projectServiceSpy = jasmine.createSpyObj('ProjectService', ['deleteProject'], {
      projects$: of(mockProjects)
    });
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [], {
      tasks$: of(mockTasks)
    });
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    console.log('TestBedの設定を開始します');
    await TestBed.configureTestingModule({
      imports: [
        ProjectListComponent,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        NoopAnimationsModule,
        OverlayModule,
        PortalModule,
        ConfirmDialogComponent,
        MatDialogModule
      ],
      providers: [
        { provide: ProjectService, useValue: projectServiceSpy },
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatDialog, useClass: MockMatDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
    projectService = TestBed.inject(ProjectService) as jasmine.SpyObj<ProjectService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    taskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    fixture.detectChanges();
    console.log('テストのセットアップが完了しました');
  });

  it('should create', () => {
    console.log('コンポーネントの作成テストを実行します');
    expect(component).toBeTruthy();
  });

  it('should load projects and tasks on init', () => {
    console.log('プロジェクトとタスクの初期ロードテストを実行します');
    expect(component.projects).toEqual(mockProjects);
    expect(component.tasks).toEqual(mockTasks);
    expect(component.loading).toBeFalse();
    expect(component.authChecking).toBeFalse();
  });

  it('should navigate to new project page', () => {
    component.navigateToNewProject();
    expect(router.navigate).toHaveBeenCalledWith(['/projects/new']);
  });

  it('should navigate to project detail page', () => {
    const project = mockProjects[0];
    component.viewProject(project);
    expect(router.navigate).toHaveBeenCalledWith(['/projects', project.id]);
  });

  it('should show confirm dialog when deleting project', fakeAsync(() => {
    console.log('プロジェクト削除の確認ダイアログテストを実行します');
    const project = mockProjects[0];

    component.deleteProject(project);
    tick();
    fixture.detectChanges();

    console.log('ダイアログの呼び出しを確認します');
    expect(dialog.open).toHaveBeenCalledWith(
      ConfirmDialogComponent,
      jasmine.objectContaining({
        width: '400px',
        data: jasmine.objectContaining({
          title: 'プロジェクトの削除',
          message: `「${project.name}」を削除してもよろしいですか？`,
          confirmText: '削除',
          cancelText: 'キャンセル'
        })
      })
    );

    const mockDialog = dialog as MockMatDialog;
    mockDialog.getLastAfterClosed().next(false);
    mockDialog.getLastAfterClosed().complete();
    tick();
    fixture.detectChanges();
  }));

  it('should delete project when confirmed', fakeAsync(() => {
    console.log('プロジェクト削除の確認テストを実行します');
    const project = mockProjects[0];
    projectService.deleteProject.and.returnValue(Promise.resolve());

    component.deleteProject(project);
    tick();
    fixture.detectChanges();

    const mockDialog = dialog as MockMatDialog;
    console.log('ダイアログの確認をシミュレートします');
    mockDialog.getLastAfterClosed().next(true);
    mockDialog.getLastAfterClosed().complete();
    tick();
    fixture.detectChanges();

    console.log('プロジェクト削除の実行を確認します');
    expect(projectService.deleteProject).toHaveBeenCalledWith(project.id);
    expect(snackBar.open).toHaveBeenCalledWith('プロジェクトを削除しました', '閉じる', { duration: 3000 });
  }));

  it('should handle delete project error', fakeAsync(() => {
    console.log('プロジェクト削除のエラーハンドリングテストを実行します');
    const project = mockProjects[0];
    const error = new Error('削除エラー');
    projectService.deleteProject.and.returnValue(Promise.reject(error));

    component.deleteProject(project);
    tick();
    fixture.detectChanges();

    const mockDialog = dialog as MockMatDialog;
    mockDialog.getLastAfterClosed().next(true);
    mockDialog.getLastAfterClosed().complete();
    tick();
    fixture.detectChanges();

    expect(projectService.deleteProject).toHaveBeenCalledWith(project.id);
    expect(snackBar.open).toHaveBeenCalledWith('プロジェクトの削除に失敗しました', '閉じる', { duration: 3000 });
  }));

  it('should get correct task count for project', () => {
    const projectId = '1';
    const count = component.getTaskCount(projectId);
    expect(count).toBe(2);
  });

  it('should return 0 for invalid project id', () => {
    const count = component.getTaskCount('');
    expect(count).toBe(0);
  });

  it('should return 0 when tasks are not loaded', () => {
    component.tasks = [];
    const count = component.getTaskCount('1');
    expect(count).toBe(0);
  });
});
