import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskListComponent } from './task-list.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Firestore } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let firestoreMock: any;
  let snackBarMock: any;
  let routerMock: any;
  let dialogMock: any;

  beforeEach(async () => {
    firestoreMock = {
      collection: jasmine.createSpy('collection').and.returnValue({
        valueChanges: () => of([
          {
            id: '1',
            title: 'Task 1',
            description: 'Description 1',
            category: 'Work',
            status: '未着手',
            priority: '高',
            dueDate: new Date(),
            assignedTo: 'User 1'
          },
          {
            id: '2',
            title: 'Task 2',
            description: 'Description 2',
            category: 'Personal',
            status: '進行中',
            priority: '中',
            dueDate: new Date(),
            assignedTo: 'User 2'
          }
        ]),
        doc: jasmine.createSpy('doc').and.returnValue({
          delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
        })
      })
    };

    snackBarMock = {
      open: jasmine.createSpy('open')
    };

    routerMock = {
      navigate: jasmine.createSpy('navigate')
    };

    dialogMock = {
      open: jasmine.createSpy('open').and.returnValue({
        afterClosed: () => of(true)
      })
    };

    await TestBed.configureTestingModule({
      declarations: [TaskListComponent],
      imports: [
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatDialogModule,
        MatSnackBarModule,
        NoopAnimationsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: Firestore, useValue: firestoreMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: Router, useValue: routerMock },
        { provide: MatDialog, useValue: dialogMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Task Management', () => {
    it('should load tasks on initialization', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.dataSource.data.length).toBe(2);
    }));

    it('should navigate to view task', () => {
      const task = { id: '1' };
      component.viewTask(task);

      expect(routerMock.navigate).toHaveBeenCalledWith(['/tasks', task.id]);
    });

    it('should open delete confirmation dialog', () => {
      const task = { id: '1' };
      const event = new Event('click');
      component.deleteTask(task, event);

      expect(dialogMock.open).toHaveBeenCalled();
    });

    it('should handle successful task deletion', fakeAsync(() => {
      const task = { id: '1' };
      const event = new Event('click');
      component.deleteTask(task, event);
      tick();

      expect(firestoreMock.collection).toHaveBeenCalledWith('tasks');
      expect(snackBarMock.open).toHaveBeenCalledWith('タスクを削除しました', '閉じる', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }));

    it('should handle task deletion cancellation', () => {
      dialogMock.open.and.returnValue({
        afterClosed: () => of(false)
      });

      const task = { id: '1' };
      const event = new Event('click');
      component.deleteTask(task, event);

      expect(firestoreMock.collection).not.toHaveBeenCalled();
    });
  });

  describe('Filtering and Sorting', () => {
    it('should apply filters', () => {
      const filterValue = 'Task 1';
      component.filterForm.patchValue({ search: filterValue });

      expect(component.dataSource.filter).toBeDefined();
    });

    it('should sort data', () => {
      const sort = { active: 'title', direction: 'asc' };
      component.dataSource.sort = {
        active: sort.active,
        direction: sort.direction
      } as any;

      component.ngAfterViewInit();

      expect(component.dataSource.sort).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', fakeAsync(() => {
      firestoreMock.collection.and.returnValue({
        valueChanges: () => throwError(() => new Error('network error'))
      });

      component.ngOnInit();
      tick();

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'ネットワークエラーが発生しました。インターネット接続をご確認ください。',
        '閉じる',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    }));

    it('should handle permission errors', fakeAsync(() => {
      firestoreMock.collection.and.returnValue({
        valueChanges: () => throwError(() => new Error('permission-denied'))
      });

      component.ngOnInit();
      tick();

      expect(snackBarMock.open).toHaveBeenCalledWith(
        '権限がありません。ログインしているかご確認ください。',
        '閉じる',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    }));
  });
}); 