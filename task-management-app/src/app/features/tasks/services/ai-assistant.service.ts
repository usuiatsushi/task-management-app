import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, CollectionReference, Query } from '@angular/fire/firestore';
import { AISuggestion, EisenhowerMatrix, TaskAnalysis } from '../models/ai-assistant.model';
import { Task } from '../models/task.model';
import { Observable, of } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

@Injectable()
export class AiAssistantService {
  private readonly categoryKeywords = {
    '仕事': ['仕事', '業務', '会議', '報告', 'プレゼン'],
    'プライベート': ['趣味', '旅行', '買い物', '家族', '友人'],
    '健康': ['運動', 'ジム', '食事', '睡眠', '健康診断'],
    '学習': ['勉強', '読書', '講座', '資格', 'スキル']
  };

  private readonly priorityKeywords = {
    '高': ['緊急', '重要', '必須', '期限切れ', '重大なバグ'],
    '中': ['計画', '戦略', '改善', '成長', '投資', '定例'],
    '低': ['確認', '連絡', '報告', '依頼', '対応', '資料']
  };

  constructor(private firestore: Firestore) {}

  // タスクのカテゴリを自動分類
  categorizeTask(task: Task): string {
    const title = task.title.toLowerCase();
    const description = task.description?.toLowerCase() || '';

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      )) {
        return category;
      }
    }

    return 'その他';
  }

  // タスクの優先度を自動設定
  calculatePriority(task: Task): '低' | '中' | '高' {
    const title = task.title.toLowerCase();
    const description = task.description?.toLowerCase() || '';

    for (const [priority, keywords] of Object.entries(this.priorityKeywords)) {
      if (keywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      )) {
        return priority as '低' | '中' | '高';
      }
    }

    return '中';
  }

  // タスクの分析と提案を生成
  async analyzeTask(task: Task): Promise<AISuggestion> {
    const category = this.categorizeTask(task);
    const priority = this.calculatePriority(task);
    const dueDate = new Date();
    const relatedTasks: string[] = [];
    const actionPlan: string[] = [];

    return {
      category,
      priority,
      suggestedDueDate: dueDate,
      relatedTasks,
      actionPlan
    };
  }

  // アイゼンハワーマトリックスによる分析
  async analyzeTaskMatrix(task: Task): Promise<EisenhowerMatrix> {
    const urgent = false;
    const important = false;
    const quadrant = '重要だが緊急でない';

    return {
      urgent,
      important,
      quadrant
    };
  }

  // タスク履歴の分析
  async analyzeTaskHistory(userId: string): Promise<TaskAnalysis> {
    return {
      historicalData: {
        averageCompletionTime: 0,
        commonCategories: [],
        frequentCollaborators: []
      },
      currentStatus: {
        workload: 0,
        overdueTasks: 0,
        upcomingDeadlines: 0
      },
      recommendations: {
        priorityAdjustments: [],
        resourceAllocation: [],
        timelineOptimization: []
      }
    };
  }

  // 過去のタスク履歴に基づいてサジェストを提供
  suggestTasks(previousTasks: Task[]): Observable<Task[]> {
    const suggestions: Task[] = [];
    
    // 単純なサジェストロジック（例：頻出タスクのパターンを検出）
    const taskPatterns = this.analyzeTaskPatterns(previousTasks);
    
    // パターンに基づいてサジェストを生成
    taskPatterns.forEach(pattern => {
      suggestions.push({
        id: '',
        title: pattern.title,
        description: pattern.description,
        category: pattern.category,
        priority: pattern.priority,
        dueDate: Timestamp.now(),
        completed: false,
        status: '未着手',
        assignedTo: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: ''
      });
    });

    return of(suggestions);
  }

  private analyzeTaskPatterns(tasks: Task[]): Task[] {
    return tasks;
  }
} 