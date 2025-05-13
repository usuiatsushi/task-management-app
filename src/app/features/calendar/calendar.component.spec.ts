import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarComponent } from './calendar.component';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from 'src/app/core/services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { MatDialog } from '@angular/material/dialog';
import { Task } from 'src/app/features/tasks/models/task.model';
import { Timestamp } from 'firebase/firestore';

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;
  let afsSpy: jasmine.SpyObj<AngularFirestore>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    afsSpy = jasmine.createSpyObj('AngularFirestore', ['collection']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        CalendarComponent,
        RouterTestingModule
      ],
      providers: [
        { provide: AngularFirestore, useValue: afsSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: FIREBASE_OPTIONS, useValue: { apiKey: 'dummy', projectId: 'dummy', appId: 'dummy' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current month', () => {
    const today = new Date();
    expect(component.currentMonth.getMonth()).toEqual(today.getMonth());
    expect(component.currentMonth.getFullYear()).toEqual(today.getFullYear());
  });

  it('should generate calendar weeks correctly', () => {
    // 2024年2月のカレンダーを生成
    component.currentMonth = new Date(2024, 1, 1); // 2月
    component.generateCalendar();
    
    // 2月は5週間分のカレンダーが生成される
    expect(component.weeks.length).toBe(5);
    
    // 最初の週の最初の日は1月28日（日曜日）
    expect(component.weeks[0][0].getDate()).toBe(28);
    expect(component.weeks[0][0].getMonth()).toBe(0); // 1月
    
    // 2月1日は木曜日（4番目）
    expect(component.weeks[0][4].getDate()).toBe(1);
    expect(component.weeks[0][4].getMonth()).toBe(1); // 2月
    
    // 最後の週の最後の日は3月2日（土曜日）
    expect(component.weeks[4][6].getDate()).toBe(2);
    expect(component.weeks[4][6].getMonth()).toBe(2); // 3月
  });

  it('should get tasks for a specific date', () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Task 1',
        description: 'Description 1',
        status: '未着手',
        importance: '中',
        category: 'カテゴリ1',
        assignedTo: 'user1',
        dueDate: Timestamp.fromDate(new Date(2024, 1, 1)),
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        userId: 'user1',
        completed: false
      },
      {
        id: '2',
        title: 'Task 2',
        description: 'Description 2',
        status: '進行中',
        importance: '高',
        category: 'カテゴリ2',
        assignedTo: 'user1',
        dueDate: Timestamp.fromDate(new Date(2024, 1, 1)),
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        userId: 'user1',
        completed: false
      }
    ];
    component.tasks = mockTasks;
    
    const tasks = component.getTasksForDate(new Date(2024, 1, 1));
    expect(tasks.length).toBe(2);
    expect(tasks[0].title).toBe('Task 1');
    expect(tasks[1].title).toBe('Task 2');
  });

  it('should filter tasks by status', () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Task 1',
        description: 'Description 1',
        status: '完了',
        importance: '中',
        category: 'カテゴリ1',
        assignedTo: 'user1',
        dueDate: Timestamp.fromDate(new Date(2024, 1, 1)),
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        userId: 'user1',
        completed: true
      },
      {
        id: '2',
        title: 'Task 2',
        description: 'Description 2',
        status: '進行中',
        importance: '高',
        category: 'カテゴリ2',
        assignedTo: 'user1',
        dueDate: Timestamp.fromDate(new Date(2024, 1, 1)),
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        userId: 'user1',
        completed: false
      }
    ];
    component.tasks = mockTasks;
    component.filterStatus = '完了';
    
    const tasks = component.getTasksForDate(new Date(2024, 1, 1));
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Task 1');
  });

  it('should navigate to previous month', () => {
    component.currentMonth = new Date(2024, 1, 1); // 2月
    component.previousMonth();
    expect(component.currentMonth.getMonth()).toBe(0); // 1月
    expect(component.currentMonth.getFullYear()).toBe(2024);
  });

  it('should navigate to next month', () => {
    component.currentMonth = new Date(2024, 1, 1); // 2月
    component.nextMonth();
    expect(component.currentMonth.getMonth()).toBe(2); // 3月
    expect(component.currentMonth.getFullYear()).toBe(2024);
  });

  it('should open task detail dialog', () => {
    const mockTask: Task = {
      id: '1',
      title: 'Task 1',
      description: 'Description 1',
      status: '未着手',
      importance: '中',
      category: 'カテゴリ1',
      assignedTo: 'user1',
      dueDate: Timestamp.fromDate(new Date()),
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      userId: 'user1',
      completed: false
    };
    component.openTaskDetail(mockTask);
    expect(dialogSpy.open).toHaveBeenCalled();
  });
}); 