import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoreTasksDialogComponent } from './more-tasks-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Task } from 'src/app/features/tasks/models/task.model';
import { Timestamp } from 'firebase/firestore';

describe('MoreTasksDialogComponent', () => {
  let component: MoreTasksDialogComponent;
  let fixture: ComponentFixture<MoreTasksDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<MoreTasksDialogComponent>>;

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'タスク1',
      description: '説明1',
      status: '未着手',
      importance: '高',
      category: 'カテゴリ1',
      assignedTo: 'user1',
      dueDate: Timestamp.fromDate(new Date()),
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      userId: 'user1',
      completed: false
    },
    {
      id: '2',
      title: 'タスク2',
      description: '説明2',
      status: '進行中',
      importance: '中',
      category: 'カテゴリ2',
      assignedTo: 'user1',
      dueDate: Timestamp.fromDate(new Date()),
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      userId: 'user1',
      completed: false
    },
    {
      id: '3',
      title: 'タスク3',
      description: '説明3',
      status: '完了',
      importance: '低',
      category: 'カテゴリ3',
      assignedTo: 'user1',
      dueDate: Timestamp.fromDate(new Date()),
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      userId: 'user1',
      completed: false
    }
  ];

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        MoreTasksDialogComponent,
        CommonModule,
        MatDialogModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { tasks: mockTasks } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MoreTasksDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display task list', () => {
    const compiled = fixture.nativeElement;
    const taskElements = compiled.querySelectorAll('.task-card');
    expect(taskElements.length).toBe(3);
    expect(taskElements[0].querySelector('.task-title').textContent).toBe('タスク1');
    expect(taskElements[1].querySelector('.task-title').textContent).toBe('タスク2');
    expect(taskElements[2].querySelector('.task-title').textContent).toBe('タスク3');
  });

  it('should apply correct status classes', () => {
    const compiled = fixture.nativeElement;
    const taskElements = compiled.querySelectorAll('.task-card');
    
    expect(taskElements[0].classList).toContain('status-not-started');
    expect(taskElements[1].classList).toContain('status-in-progress');
    expect(taskElements[2].classList).toContain('status-completed');
  });

  it('should apply correct priority classes', () => {
    const compiled = fixture.nativeElement;
    const taskElements = compiled.querySelectorAll('.task-card');
    
    expect(taskElements[0].classList).toContain('priority-high');
    expect(taskElements[1].classList).toContain('priority-medium');
    expect(taskElements[2].classList).toContain('priority-low');
  });

  it('should display task status and priority', () => {
    const compiled = fixture.nativeElement;
    const taskElements = compiled.querySelectorAll('.task-card');
    
    expect(taskElements[0].querySelector('.task-status').textContent).toBe('未着手');
    expect(taskElements[0].querySelector('.task-priority').textContent).toBe('高');
    
    expect(taskElements[1].querySelector('.task-status').textContent).toBe('進行中');
    expect(taskElements[1].querySelector('.task-priority').textContent).toBe('中');
    
    expect(taskElements[2].querySelector('.task-status').textContent).toBe('完了');
    expect(taskElements[2].querySelector('.task-priority').textContent).toBe('低');
  });

  it('should close dialog when close button is clicked', () => {
    const compiled = fixture.nativeElement;
    const closeButton = compiled.querySelector('button[mat-dialog-close]');
    closeButton.click();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
}); 