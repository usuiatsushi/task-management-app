import { TestBed } from '@angular/core/testing';
import { AiAssistantService } from './ai-assistant.service';
import { Task } from '../models/task.model';
import { Timestamp, Firestore, QuerySnapshot, QueryDocumentSnapshot, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot as FirestoreQueryDocumentSnapshot } from '@angular/fire/firestore';
import * as firestore from '@angular/fire/firestore';

describe('AiAssistantService', () => {
  let service: AiAssistantService;
  let mockFirestore: any;

  beforeEach(async () => {
    const taskConverter: FirestoreDataConverter<Task, DocumentData> = {
      toFirestore: (task: Task): DocumentData => ({
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        completed: task.completed,
        assignedTo: task.assignedTo,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        userId: task.userId
      }),
      fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return {
          id: snapshot.id,
          title: data['title'],
          description: data['description'],
          category: data['category'],
          priority: data['priority'],
          status: data['status'],
          dueDate: data['dueDate'],
          completed: data['completed'],
          assignedTo: data['assignedTo'],
          createdAt: data['createdAt'],
          updatedAt: data['updatedAt'],
          userId: data['userId']
        } as Task;
      }
    };

    const mockCollection = jasmine.createSpyObj('CollectionReference', ['withConverter', 'doc', 'where']);
    mockCollection.withConverter.and.returnValue(mockCollection);

    const mockQuery = jasmine.createSpyObj('Query', ['where']);
    
    const mockTask: Task = {
      id: '1',
      title: 'テストタスク1',
      description: 'テスト説明1',
      category: '仕事',
      priority: '中',
      status: '未着手',
      dueDate: Timestamp.now(),
      completed: false,
      assignedTo: 'user1',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: 'user1'
    };

    const mockDocSnapshot = {
      data: () => mockTask,
      metadata: {
        fromCache: false,
        hasPendingWrites: false,
        isEqual: () => true
      },
      exists: () => true,
      get: () => null,
      id: '1',
      ref: null as any
    } as unknown as QueryDocumentSnapshot<Task>;

    const mockQuerySnapshot = {
      docs: [mockDocSnapshot],
      metadata: {
        fromCache: false,
        hasPendingWrites: false,
        isEqual: () => true
      },
      query: mockQuery,
      size: 1,
      empty: false,
      forEach: (callback: (result: FirestoreQueryDocumentSnapshot<Task>) => void) => [mockDocSnapshot].forEach(callback),
      docChanges: () => []
    } as unknown as QuerySnapshot<Task>;

    mockFirestore = {
      collection: jasmine.createSpy('collection').and.returnValue(mockCollection)
    };

    // Firestoreの関数をモック
    spyOn(firestore, 'collection').and.callFake(() => {
      const col = mockCollection;
      col.withConverter.and.returnValue({
        ...col,
        converter: taskConverter
      });
      return col;
    });
    spyOn(firestore, 'query').and.callFake(() => mockQuery);
    spyOn(firestore, 'where').and.callFake(() => mockQuery);
    spyOn(firestore, 'getDocs').and.callFake(() => Promise.resolve(mockQuerySnapshot));

    await TestBed.configureTestingModule({
      providers: [
        AiAssistantService,
        { provide: Firestore, useValue: mockFirestore }
      ]
    }).compileComponents();

    service = TestBed.inject(AiAssistantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('カテゴリ分類のテスト', () => {
    const testCases = [
      {
        title: "会議の議事録作成",
        description: "月次報告会議の議事録を作成する",
        expectedCategory: "仕事"
      },
      {
        title: "ジム通い",
        description: "週3回のジム通いを継続する",
        expectedCategory: "健康"
      },
      {
        title: "英語の勉強",
        description: "TOEIC対策の勉強を始める",
        expectedCategory: "学習"
      },
      {
        title: "家族旅行の計画",
        description: "夏休みの家族旅行の計画を立てる",
        expectedCategory: "プライベート"
      },
      {
        title: "不明なカテゴリのタスク",
        description: "特に分類できないタスク",
        expectedCategory: "その他"
      }
    ];

    testCases.forEach(test => {
      it(`"${test.title}" は "${test.expectedCategory}" に分類されるべき`, () => {
        const task: Task = {
          id: '',
          title: test.title,
          description: test.description,
          category: '',
          priority: '中',
          dueDate: Timestamp.now(),
          completed: false,
          status: '未着手',
          assignedTo: '',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          userId: ''
        };

        const category = service.categorizeTask(task);
        expect(category).toBe(test.expectedCategory);
      });
    });
  });

  describe('優先度設定のテスト', () => {
    const testCases = [
      {
        title: "緊急のバグ修正",
        description: "本番環境で発生した重大なバグを修正する必須タスク",
        expectedPriority: "高"
      },
      {
        title: "定例会議の設定",
        description: "チームの定例会議の日程を調整する",
        expectedPriority: "中"
      },
      {
        title: "資料の確認",
        description: "共有された資料の内容を確認する",
        expectedPriority: "低"
      },
      {
        title: "一般的なタスク",
        description: "特に優先度を示すキーワードがないタスク",
        expectedPriority: "中"
      }
    ];

    testCases.forEach(test => {
      it(`"${test.title}" は優先度 "${test.expectedPriority}" に設定されるべき`, () => {
        const task: Task = {
          id: '',
          title: test.title,
          description: test.description,
          category: '',
          priority: '中',
          dueDate: Timestamp.now(),
          completed: false,
          status: '未着手',
          assignedTo: '',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          userId: ''
        };

        const priority = service.setPriority(task);
        expect(priority).toBe(test.expectedPriority);
      });
    });
  });

  describe('タスク提案機能のテスト', () => {
    const previousTasks: Task[] = [
      {
        id: '1',
        title: '週次報告作成',
        description: 'プロジェクトの週次進捗報告を作成',
        category: '仕事',
        priority: '中',
        status: '完了',
        dueDate: Timestamp.now(),
        completed: true,
        assignedTo: 'user1',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: 'user1'
      },
      {
        id: '2',
        title: '月次報告作成',
        description: '部門の月次業績報告を作成',
        category: '仕事',
        priority: '中',
        status: '完了',
        dueDate: Timestamp.now(),
        completed: true,
        assignedTo: 'user1',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: 'user1'
      }
    ];

    it('過去のタスクパターンに基づいて新しいタスクを提案する', (done) => {
      service.suggestTasks(previousTasks).subscribe(suggestions => {
        expect(suggestions.length).toBeGreaterThan(0);
        
        const suggestion = suggestions[0];
        expect(suggestion.title).toBeTruthy();
        expect(suggestion.description).toBeTruthy();
        expect(suggestion.category).toBeTruthy();
        expect(['低', '中', '高']).toContain(suggestion.priority);
        expect(suggestion.status).toBe('未着手');
        expect(suggestion.completed).toBeFalse();
        
        done();
      });
    });

    it('提案されたタスクは適切なプロパティを持つ', (done) => {
      service.suggestTasks(previousTasks).subscribe(suggestions => {
        suggestions.forEach(suggestion => {
          expect(suggestion).toEqual(jasmine.objectContaining({
            id: '',
            title: jasmine.any(String),
            description: jasmine.any(String),
            category: jasmine.any(String),
            priority: jasmine.any(String),
            status: '未着手',
            completed: false,
            assignedTo: jasmine.any(String),
            createdAt: jasmine.any(Object),
            updatedAt: jasmine.any(Object),
            userId: jasmine.any(String)
          }));
        });
        done();
      });
    });
  });

  describe('タスク分析機能のテスト', () => {
    const testTask: Task = {
      id: '1',
      title: '新機能開発の要件定義',
      description: '顧客からの要望に基づく新機能の要件定義を行う',
      category: '仕事',
      priority: '高',
      status: '未着手',
      dueDate: Timestamp.now(),
      completed: false,
      assignedTo: 'user1',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: 'user1'
    };

    it('タスクの分析結果が正しい形式で返される', async () => {
      const analysis = await service.analyzeTask(testTask);
      
      expect(analysis).toBeTruthy();
      expect(analysis.category).toBeTruthy();
      expect(['低', '中', '高']).toContain(analysis.priority);
      expect(analysis.suggestedDueDate).toBeInstanceOf(Date);
      expect(Array.isArray(analysis.relatedTasks)).toBeTrue();
      expect(Array.isArray(analysis.actionPlan)).toBeTrue();
    });

    it('アイゼンハワーマトリックス分析が正しい形式で返される', async () => {
      const matrix = await service.analyzeTaskMatrix(testTask);
      
      expect(matrix).toBeTruthy();
      expect(typeof matrix.urgent).toBe('boolean');
      expect(typeof matrix.important).toBe('boolean');
      expect([
        '重要かつ緊急',
        '重要だが緊急でない',
        '緊急だが重要でない',
        '重要でも緊急でもない'
      ]).toContain(matrix.quadrant);
    });

    it('タスク履歴の分析が正しい形式で返される', async () => {
      const analysis = await service.analyzeTaskHistory('user1');
      
      expect(analysis).toBeTruthy();
      expect(analysis.historicalData).toBeTruthy();
      expect(typeof analysis.historicalData.averageCompletionTime).toBe('number');
      expect(Array.isArray(analysis.historicalData.commonCategories)).toBeTrue();
      expect(Array.isArray(analysis.historicalData.frequentCollaborators)).toBeTrue();
      
      expect(analysis.currentStatus).toBeTruthy();
      expect(typeof analysis.currentStatus.workload).toBe('number');
      expect(typeof analysis.currentStatus.overdueTasks).toBe('number');
      expect(typeof analysis.currentStatus.upcomingDeadlines).toBe('number');
      
      expect(analysis.recommendations).toBeTruthy();
      expect(Array.isArray(analysis.recommendations.priorityAdjustments)).toBeTrue();
      expect(Array.isArray(analysis.recommendations.resourceAllocation)).toBeTrue();
      expect(Array.isArray(analysis.recommendations.timelineOptimization)).toBeTrue();
    });
  });

  describe('タスク履歴分析のテスト', () => {
    it('タスク履歴の分析が正しく行われるべき', async () => {
      const userId = 'test-user';
      const analysis = await service.analyzeTaskHistory(userId);
      
      expect(analysis).toBeTruthy();
      expect(analysis.historicalData).toBeTruthy();
      expect(analysis.currentStatus).toBeTruthy();
      expect(analysis.recommendations).toBeTruthy();
    });
  });
}); 