import { TestBed } from '@angular/core/testing';
import { AiAssistantService } from './ai-assistant.service';
import { Firestore } from '@angular/fire/firestore';
import { ErrorHandler } from '../utils/error-handler';
import { Task } from '../models/task.model';
import { AISuggestion } from '../models/ai-assistant.model';
import { FirestoreError } from '../models/ai-assistant.error';
import { Timestamp } from '@angular/fire/firestore';

describe('AiAssistantService', () => {
  let service: AiAssistantService;
  let firestoreSpy: any;
  let errorHandlerSpy: jasmine.SpyObj<ErrorHandler>;

  beforeEach(() => {
    const firestoreMock = {
      collection: jasmine.createSpy('collection').and.returnValue({
        get: jasmine.createSpy('get').and.returnValue(Promise.resolve({
          docs: []
        }))
      })
    };
    const errorHandlerMock = jasmine.createSpyObj('ErrorHandler', ['handleError']);

    TestBed.configureTestingModule({
      providers: [
        AiAssistantService,
        { provide: Firestore, useValue: firestoreMock },
        { provide: ErrorHandler, useValue: errorHandlerMock }
      ]
    });

    service = TestBed.inject(AiAssistantService);
    firestoreSpy = TestBed.inject(Firestore);
    errorHandlerSpy = TestBed.inject(ErrorHandler) as jasmine.SpyObj<ErrorHandler>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('categorizeTask', () => {
    it('should categorize task based on keywords', async () => {
      const task: Task = {
        id: '1',
        title: '会議の準備',
        description: '来週のプロジェクト会議の資料を作成する',
        category: '',
        priority: '中',
        dueDate: Timestamp.now(),
        completed: false,
        status: '未着手',
        assignedTo: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: 'user1'
      };

      const result = await service.categorizeTask(task);
      expect(result).toBe('仕事');
    });

    it('should handle validation error', async () => {
      const task: Task = {
        id: '1',
        title: '',
        description: '',
        category: '',
        priority: '中',
        dueDate: Timestamp.now(),
        completed: false,
        status: '未着手',
        assignedTo: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: 'user1'
      };

      await expectAsync(service.categorizeTask(task)).toBeRejected();
    });
  });

  describe('calculatePriority', () => {
    it('should calculate priority based on keywords', async () => {
      const task: Task = {
        id: '1',
        title: '緊急のバグ修正',
        description: '重大なバグを修正する必要があります',
        category: '仕事',
        priority: '中',
        dueDate: Timestamp.now(),
        completed: false,
        status: '未着手',
        assignedTo: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: 'user1'
      };

      const result = await service.calculatePriority(task);
      expect(result).toBe('高');
    });
  });

  describe('analyzeTask', () => {
    it('should analyze task and return suggestions', async () => {
      const task: Task = {
        id: '1',
        title: 'プロジェクトの進捗報告',
        description: '今週のプロジェクト進捗を報告する',
        category: '仕事',
        priority: '中',
        dueDate: Timestamp.now(),
        completed: false,
        status: '未着手',
        assignedTo: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: 'user1'
      };

      const result = await service.analyzeTask(task);
      expect(result).toBeDefined();
      expect(result.category).toBe('仕事');
      expect(result.priority).toBe('中');
      expect(result.suggestedDueDate).toBeInstanceOf(Date);
      expect(result.relatedTasks).toBeInstanceOf(Array);
      expect(result.actionPlan).toBeInstanceOf(Array);
    });

    it('should handle Firestore errors', async () => {
      const task: Task = {
        id: '1',
        title: 'テストタスク',
        description: 'テスト用のタスク',
        category: '仕事',
        priority: '中',
        dueDate: Timestamp.now(),
        completed: false,
        status: '未着手',
        assignedTo: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: 'user1'
      };

      firestoreSpy.collection.and.throwError(new Error('Firestore error'));

      await expectAsync(service.analyzeTask(task)).toBeRejectedWith(FirestoreError);
    });
  });

  describe('retryOperation', () => {
    it('should retry operation on failure', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary error');
        }
        return 'success';
      };

      const result = await service['retryOperation'](operation, 'test');
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw error after max retries', async () => {
      const operation = async () => {
        throw new Error('Permanent error');
      };

      await expectAsync(service['retryOperation'](operation, 'test')).toBeRejected();
    });
  });
}); 