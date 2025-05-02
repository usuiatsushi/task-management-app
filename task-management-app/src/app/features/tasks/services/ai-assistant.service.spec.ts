import { TestBed } from '@angular/core/testing';
import { AiAssistantService } from './ai-assistant.service';
import { Task } from '../models/task.model';
import { Timestamp } from '@firebase/firestore';
import { Firestore } from '@angular/fire/firestore';

describe('AiAssistantService', () => {
  let service: AiAssistantService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AiAssistantService,
        {
          provide: Firestore,
          useValue: {
            collection: () => {},
            query: () => {},
            where: () => {},
            getDocs: () => Promise.resolve({ docs: [] })
          }
        }
      ]
    });

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

        const priority = service.calculatePriority(task);
        expect(priority).toBe(test.expectedPriority);
      });
    });
  });

  describe('タスク提案機能のテスト', () => {
    it('過去のタスクパターンに基づいて新しいタスクを提案する', (done) => {
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
        }
      ];

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
  });
}); 