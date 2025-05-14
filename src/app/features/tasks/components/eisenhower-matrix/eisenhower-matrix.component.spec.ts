import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EisenhowerMatrixComponent } from './eisenhower-matrix.component';
import { Task } from '../../models/task.model';
import { Timestamp } from '@angular/fire/firestore';
import { DatePipe } from '@angular/common';

describe('EisenhowerMatrixComponent', () => {
  let component: EisenhowerMatrixComponent;
  let fixture: ComponentFixture<EisenhowerMatrixComponent>;

  const mockTasks: Task[] = [
    {
      id: '1',
      title: '緊急かつ重要なタスク',
      description: 'テストタスク1',
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
      title: '重要だが緊急でないタスク',
      description: 'テストタスク2',
      status: '未着手',
      importance: '高',
      urgent: false,
      category: '開発',
      assignedTo: 'ユーザー2',
      dueDate: Timestamp.fromDate(new Date('2024-12-31')),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: 'user2',
      completed: false
    },
    {
      id: '3',
      title: '緊急だが重要でないタスク',
      description: 'テストタスク3',
      status: '未着手',
      importance: '中',
      urgent: true,
      category: '開発',
      assignedTo: 'ユーザー3',
      dueDate: Timestamp.fromDate(new Date('2024-12-31')),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: 'user3',
      completed: false
    },
    {
      id: '4',
      title: '緊急でも重要でもないタスク',
      description: 'テストタスク4',
      status: '未着手',
      importance: '中',
      urgent: false,
      category: '開発',
      assignedTo: 'ユーザー4',
      dueDate: Timestamp.fromDate(new Date('2024-12-31')),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: 'user4',
      completed: false
    },
    {
      id: '5',
      title: '完了済みタスク',
      description: 'テストタスク5',
      status: '完了',
      importance: '高',
      urgent: true,
      category: '開発',
      assignedTo: 'ユーザー5',
      dueDate: Timestamp.fromDate(new Date('2024-12-31')),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: 'user5',
      completed: true
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EisenhowerMatrixComponent,
        DatePipe
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EisenhowerMatrixComponent);
    component = fixture.componentInstance;
    component.tasks = mockTasks;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter out completed tasks', () => {
    expect(component['incompleteTasks'].length).toBe(4);
    expect(component['incompleteTasks'].every(task => task.status !== '完了')).toBeTrue();
  });

  it('should correctly categorize tasks into quadrants', () => {
    expect(component.quadrant1.length).toBe(1);
    expect(component.quadrant1[0].title).toBe('緊急かつ重要なタスク');

    expect(component.quadrant2.length).toBe(1);
    expect(component.quadrant2[0].title).toBe('重要だが緊急でないタスク');

    expect(component.quadrant3.length).toBe(1);
    expect(component.quadrant3[0].title).toBe('緊急だが重要でないタスク');

    expect(component.quadrant4.length).toBe(1);
    expect(component.quadrant4[0].title).toBe('緊急でも重要でもないタスク');
  });

  it('should convert various date formats correctly', () => {
    const date = new Date('2024-12-31');
    const timestamp = Timestamp.fromDate(date);
    const dateString = '2024-12-31';
    const dateNumber = date.getTime();

    expect(component.toDate(date)).toEqual(date);
    expect(component.toDate(timestamp)).toEqual(date);
    expect(component.toDate(dateString)).toEqual(date);
    expect(component.toDate(dateNumber)).toEqual(date);
    expect(component.toDate(null)).toBeNull();
  });

  it('should display task information correctly', () => {
    const compiled = fixture.nativeElement;
    const taskCards = compiled.querySelectorAll('.task-card');

    expect(taskCards.length).toBe(4); // 完了済みタスクを除く

    // 各クアドラントのタイトルが正しく表示されているか確認
    const quadrantTitles = compiled.querySelectorAll('.quadrant-title');
    expect(quadrantTitles[0].textContent).toContain('緊急かつ重要');
    expect(quadrantTitles[1].textContent).toContain('重要だが緊急でない');
    expect(quadrantTitles[2].textContent).toContain('緊急だが重要でない');
    expect(quadrantTitles[3].textContent).toContain('緊急でも重要でもない');
  });
}); 