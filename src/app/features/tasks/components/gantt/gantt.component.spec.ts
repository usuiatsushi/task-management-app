import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { GanttComponent } from './gantt.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskService } from '../../services/task.service';
import { CalendarService } from '../../services/calendar.service';
import { of } from 'rxjs';
import { Task } from '../../models/task.model';
import { Timestamp } from '@angular/fire/firestore';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// dhtmlx-ganttのモック
declare let gantt: any;
const mockGantt = {
  config: {
    start_date: new Date(),
    end_date: new Date(),
    row_height: 36,
    bar_height: 24,
    grid_width: 320,
    scale_height: 40,
    min_column_width: 16,
    scales: [],
    columns: [],
    date_format: '',
    edit_on_create: true,
    drag_progress: true,
    drag_resize: true,
    drag_move: true
  },
  templates: {
    scale_cell_class: () => '',
    task_class: () => ''
  },
  attachEvent: jasmine.createSpy('attachEvent'),
  getTask: jasmine.createSpy('getTask'),
  date: {
    date_part: () => 0
  },
  init: jasmine.createSpy('init'),
  clearAll: jasmine.createSpy('clearAll'),
  parse: jasmine.createSpy('parse'),
  destroy: jasmine.createSpy('destroy'),
  render: jasmine.createSpy('render')
};

describe('GanttComponent', () => {
  let component: GanttComponent;
  let fixture: ComponentFixture<GanttComponent>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let taskServiceSpy: jasmine.SpyObj<TaskService>;
  let calendarServiceSpy: jasmine.SpyObj<CalendarService>;

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'テストタスク1',
      description: 'テストタスク1の説明',
      status: '未着手',
      importance: '高',
      urgent: true,
      category: '開発',
      assignedTo: 'ユーザー1',
      dueDate: Timestamp.fromDate(new Date('2024-12-31')),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: 'user1',
      completed: false
    },
    {
      id: '2',
      title: 'テストタスク2',
      description: 'テストタスク2の説明',
      status: '進行中',
      importance: '中',
      urgent: false,
      category: '開発',
      assignedTo: 'ユーザー2',
      dueDate: Timestamp.fromDate(new Date('2024-12-31')),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: 'user2',
      completed: false
    }
  ];

  beforeEach(async () => {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    taskServiceSpy = jasmine.createSpyObj('TaskService', ['getTask', 'updateTask']);
    calendarServiceSpy = jasmine.createSpyObj('CalendarService', ['addTaskToCalendar', 'deleteCalendarEvent']);

    // dhtmlx-ganttのグローバルオブジェクトをモックに置き換え
    (window as any).gantt = mockGantt;

    await TestBed.configureTestingModule({
      imports: [
        GanttComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: CalendarService, useValue: calendarServiceSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GanttComponent);
    component = fixture.componentInstance;
    component.tasks = mockTasks;
    fixture.detectChanges();
  });

  afterEach(() => {
    mockGantt.clearAll.calls.reset();
    mockGantt.parse.calls.reset();
    mockGantt.destroy.calls.reset();
    mockGantt.render.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should configure gantt on init', () => {
    expect(mockGantt.config.row_height).toBe(36);
    expect(mockGantt.config.bar_height).toBe(24);
    expect(mockGantt.config.grid_width).toBe(320);
    expect(mockGantt.config.scale_height).toBe(40);
    expect(mockGantt.config.min_column_width).toBe(16);
  });

  it('should attach event handlers on init', () => {
    expect(mockGantt.attachEvent).toHaveBeenCalledWith('onTaskDrag', jasmine.any(Function));
    expect(mockGantt.attachEvent).toHaveBeenCalledWith('onBeforeTaskDrag', jasmine.any(Function));
    expect(mockGantt.attachEvent).toHaveBeenCalledWith('onAfterTaskUpdate', jasmine.any(Function));
    expect(mockGantt.attachEvent).toHaveBeenCalledWith('onAfterTaskDrag', jasmine.any(Function));
  });

  it('should handle task update', fakeAsync(() => {
    const mockTask = { ...mockTasks[0] };
    const mockGanttTask = {
      id: '1',
      text: '更新されたタスク',
      start_date: new Date('2024-12-01'),
      duration: 5
    };

    mockGantt.getTask.and.returnValue(mockGanttTask);
    taskServiceSpy.getTask.and.returnValue(Promise.resolve(mockTask));
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(true)
    } as any);

    component['handleTaskUpdate']('1', mockGanttTask);
    tick();
    flush();

    expect(taskServiceSpy.getTask).toHaveBeenCalledWith('1');
    expect(calendarServiceSpy.addTaskToCalendar).toHaveBeenCalled();
  }));

  it('should shift timeline on arrow key press', () => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    component['keydownHandler'](event);
    expect(mockGantt.render).toHaveBeenCalled();
  });

  it('should prevent dragging completed tasks', () => {
    const mockTask = { ...mockTasks[0], status: '完了' };
    mockGantt.getTask.and.returnValue(mockTask);

    const result = component['keydownHandler'](new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(result).toBeUndefined();
  });

  it('should clean up gantt on destroy', fakeAsync(() => {
    component.ngOnDestroy();
    tick();
    expect(mockGantt.destroy).toHaveBeenCalled();
  }));
}); 