import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { Task } from 'src/app/features/tasks/models/task.model';
import { Timestamp } from 'firebase/firestore';
import { NgChartsModule } from 'ng2-charts';
import { MatIconModule } from '@angular/material/icon';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  const now = new Date('2024-03-20T12:00:00Z'); // 水曜日

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'タスク1',
      description: '説明1',
      status: '未着手',
      importance: '高',
      category: 'カテゴリ1',
      assignedTo: 'user1',
      dueDate: Timestamp.fromDate(new Date('2024-03-20T12:00:00Z')),
      createdAt: Timestamp.fromDate(new Date('2024-03-20T12:00:00Z')),
      updatedAt: Timestamp.fromDate(new Date('2024-03-20T12:00:00Z')),
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
      assignedTo: 'user2',
      dueDate: Timestamp.fromDate(new Date('2024-03-19T12:00:00Z')), // 1日前
      createdAt: Timestamp.fromDate(new Date('2024-03-20T12:00:00Z')),
      updatedAt: Timestamp.fromDate(new Date('2024-03-20T12:00:00Z')),
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
      dueDate: Timestamp.fromDate(new Date('2024-03-20T12:00:00Z')),
      createdAt: Timestamp.fromDate(new Date('2024-03-20T12:00:00Z')),
      updatedAt: Timestamp.fromDate(new Date('2024-03-20T12:00:00Z')),
      userId: 'user1',
      completed: true
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        NgChartsModule,
        MatIconModule
      ]
    }).compileComponents();

    // 日時をモック
    jasmine.clock().install();
    jasmine.clock().mockDate(now);

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    component.tasks = mockTasks;
    component.ngOnChanges();
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate progress percentage correctly', () => {
    expect(component.progressPercent).toBe(33); // 3つのタスクのうち1つが完了
  });

  it('should calculate overdue tasks correctly', () => {
    expect(component.overdueCount).toBe(1); // 1つの期限切れタスク
  });

  it('should update pie chart data correctly', () => {
    expect(component.pieChartData.datasets[0].data).toEqual([1, 1, 1]); // 未着手1、進行中1、完了1
  });

  it('should update priority bar chart data correctly', () => {
    expect(component.barPriorityData.datasets[0].data).toEqual([1, 1, 1]); // 低1、中1、高1
  });

  it('should update assignee bar chart data correctly', () => {
    const assigneeData = component.barAssigneeData.datasets[0].data as number[];
    expect(assigneeData).toContain(2); // user1のタスク数
    expect(assigneeData).toContain(1); // user2のタスク数
  });

  it('should update category chart data correctly', () => {
    const categoryData = component.categoryChartData.datasets[0].data as number[];
    expect(categoryData).toEqual([1, 1, 1]); // 各カテゴリ1つずつ
  });

  it('should update task trend data correctly', () => {
    expect(component.lineTaskTrendData.datasets.length).toBe(2); // 新規タスクと完了タスクの2つのデータセット
  });

  it('should update completion rate data correctly', () => {
    expect(component.completionRateData.datasets[0].data.length).toBeGreaterThan(0);
  });

  it('should update weekly goal data correctly', () => {
    expect(component.weeklyGoalData.datasets[0].data).toEqual([33, 67]); // 33%の達成率
  });

  it('should update priority completion data correctly', () => {
    expect(component.priorityCompletionData.datasets.length).toBe(2); // 完了と未完了の2つのデータセット
  });
});
