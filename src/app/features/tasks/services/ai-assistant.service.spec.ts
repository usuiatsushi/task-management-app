import { TestBed } from '@angular/core/testing';
import { AiAssistantService } from './ai-assistant.service';
import { Task } from '../models/task.model';
import { Timestamp } from '@angular/fire/firestore';

describe('AiAssistantService', () => {
  let service: AiAssistantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
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
}); 