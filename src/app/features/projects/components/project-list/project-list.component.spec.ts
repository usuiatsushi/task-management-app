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
import { Injectable, Injector, NgZone } from '@angular/core';
import { Overlay, OverlayContainer, ScrollStrategyOptions } from '@angular/cdk/overlay';
import { Platform } from '@angular/cdk/platform';
import { Location } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { DOCUMENT } from '@angular/common';

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
class MockMatDialog {
  private afterClosedSubject = new Subject<boolean>();
  private _openDialogs: MatDialogRef<any>[] = [];

  constructor() {
    this._openDialogs = [];
  }

  open(component: any, config?: any): MatDialogRef<any> {
    const dialogRef = {
      afterClosed: () => this.afterClosedSubject.asObservable(),
      close: () => {
        this.afterClosedSubject.next(false);
        this._openDialogs = this._openDialogs.filter(ref => ref !== dialogRef);
      },
      backdropClick: () => of(null),
      keydownEvents: () => of(null),
      beforeClosed: () => of(null),
      disableClose: false,
      id: Math.random().toString(36).substring(7),
      componentInstance: {},
      updatePosition: () => dialogRef,
      updateSize: () => dialogRef,
      _ref: { push: () => {} },
      _containerInstance: {},
      componentRef: {},
      _afterOpened: of(null),
      _afterAllClosed: of(null),
      _beforeAllClosed: of(null),
      _getStateChanges: () => of(null),
      _getOverlayRef: () => ({ dispose: () => {} }),
      _getContainerInstance: () => ({}),
      _getComponentInstance: () => ({}),
      _getOverlayContainer: () => ({ getContainerElement: () => document.createElement('div') }),
      _result: undefined,
      _beforeClosed: of(null)
    } as unknown as MatDialogRef<any>;

    this._openDialogs.push(dialogRef);
    return dialogRef;
  }

  closeDialog(result: boolean) {
    this.afterClosedSubject.next(result);
    if (this._openDialogs.length > 0) {
      const dialogRef = this._openDialogs[this._openDialogs.length - 1];
      this._openDialogs = this._openDialogs.filter(ref => ref !== dialogRef);
    }
  }

  getDialogById(id: string): MatDialogRef<any> | undefined {
    return this._openDialogs.find(dialog => dialog.id === id);
  }

  closeAll(): void {
    this._openDialogs.forEach(dialog => dialog.close());
    this._openDialogs = [];
  }
}

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let taskService: jasmine.SpyObj<TaskService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let router: jasmine.SpyObj<Router>;
  let dialog: MockMatDialog;

  beforeEach(async () => {
    console.log('テストのセットアップを開始します');
    const projectServiceSpy = jasmine.createSpyObj('ProjectService', ['deleteProject'], {
      projects$: of(mockProjects)
    });
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [], {
      tasks$: of(mockTasks)
    });
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const mockDialog = new MockMatDialog();

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
        ConfirmDialogComponent
      ],
      providers: [
        { provide: ProjectService, useValue: projectServiceSpy },
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    projectService = TestBed.inject(ProjectService) as jasmine.SpyObj<ProjectService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    taskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    dialog = TestBed.inject(MatDialog) as unknown as MockMatDialog;
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
    const project = mockProjects[0];
    const dialogRef = dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'プロジェクトの削除',
        message: `「${project.name}」を削除してもよろしいですか？`,
        confirmText: '削除',
        cancelText: 'キャンセル'
      }
    });

    component.deleteProject(project);
    tick();
    fixture.detectChanges();

    expect(dialogRef).toBeTruthy();
    dialog.closeDialog(true);
    tick();
  }));

  it('should delete project when confirmed', fakeAsync(() => {
    const project = mockProjects[0];
    const dialogRef = dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'プロジェクトの削除',
        message: `「${project.name}」を削除してもよろしいですか？`,
        confirmText: '削除',
        cancelText: 'キャンセル'
      }
    });
    projectService.deleteProject.and.returnValue(Promise.resolve());

    component.deleteProject(project);
    tick();
    fixture.detectChanges();

    dialog.closeDialog(true);
    tick();
    fixture.detectChanges();

    expect(projectService.deleteProject).toHaveBeenCalledWith(project.id);
    expect(snackBar.open).toHaveBeenCalledWith('プロジェクトを削除しました', '閉じる', { duration: 3000 });
  }));

  it('should handle delete project error', fakeAsync(() => {
    const project = mockProjects[0];
    const dialogRef = dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'プロジェクトの削除',
        message: `「${project.name}」を削除してもよろしいですか？`,
        confirmText: '削除',
        cancelText: 'キャンセル'
      }
    });
    const error = new Error('削除エラー');
    projectService.deleteProject.and.returnValue(Promise.reject(error));

    component.deleteProject(project);
    tick();
    fixture.detectChanges();

    dialog.closeDialog(true);
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
