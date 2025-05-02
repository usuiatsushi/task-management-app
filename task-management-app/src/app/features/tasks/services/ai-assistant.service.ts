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

  async analyzeTask(task: Task): Promise<AISuggestion> {
    // タスクの分析と提案を生成
    const category = await this.suggestCategory(task.title, task.description);
    const priority = this.calculatePriority(task);
    const dueDate = this.suggestDueDate(task);
    const relatedTasks = await this.findRelatedTasks(task);
    const actionPlan = this.generateActionPlan(task);

    return {
      category,
      priority,
      suggestedDueDate: dueDate,
      relatedTasks,
      actionPlan
    };
  }

  async analyzeTaskMatrix(task: Task): Promise<EisenhowerMatrix> {
    // アイゼンハワーマトリックスによる分析
    const urgent = this.isUrgent(task);
    const important = this.isImportant(task);
    const quadrant = this.determineQuadrant(urgent, important);

    return {
      urgent,
      important,
      quadrant
    };
  }

  async analyzeTaskHistory(userId: string): Promise<TaskAnalysis> {
    try {
      // タスク履歴の分析
      const tasksRef = collection(this.firestore, 'tasks') as CollectionReference<Task>;
      const q = query(tasksRef, where('userId', '==', userId)) as Query<Task>;
      const querySnapshot = await getDocs(q);
      
      const tasks = querySnapshot.docs.map(doc => doc.data());
      
      return {
        historicalData: {
          averageCompletionTime: this.calculateAverageCompletionTime(tasks),
          commonCategories: this.findCommonCategories(tasks),
          frequentCollaborators: this.findFrequentCollaborators(tasks)
        },
        currentStatus: {
          workload: this.calculateCurrentWorkload(tasks),
          overdueTasks: this.countOverdueTasks(tasks),
          upcomingDeadlines: this.countUpcomingDeadlines(tasks)
        },
        recommendations: {
          priorityAdjustments: this.generatePriorityRecommendations(tasks),
          resourceAllocation: this.generateResourceRecommendations(tasks),
          timelineOptimization: this.generateTimelineRecommendations(tasks)
        }
      };
    } catch (error) {
      console.error('タスク履歴の分析中にエラーが発生しました:', error);
      // エラーが発生した場合でもデフォルト値を返す
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
  }

  private async suggestCategory(title: string, description: string): Promise<string> {
    // カテゴリ提案のロジック
    // TODO: より高度な分析を実装
    return '技術的課題';
  }

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

  private suggestDueDate(task: Task): Date {
    // 期限提案のロジック
    // TODO: より高度な分析を実装
    return new Date();
  }

  private async findRelatedTasks(task: Task): Promise<string[]> {
    // 関連タスク検索のロジック
    // TODO: より高度な分析を実装
    return [];
  }

  private generateActionPlan(task: Task): string[] {
    // アクションプラン生成のロジック
    // TODO: より高度な分析を実装
    return [];
  }

  private isUrgent(task: Task): boolean {
    // 緊急性判定のロジック
    // TODO: より高度な分析を実装
    return false;
  }

  private isImportant(task: Task): boolean {
    // 重要性判定のロジック
    // TODO: より高度な分析を実装
    return false;
  }

  private determineQuadrant(urgent: boolean, important: boolean): '重要かつ緊急' | '重要だが緊急でない' | '緊急だが重要でない' | '重要でも緊急でもない' {
    if (urgent && important) return '重要かつ緊急';
    if (important && !urgent) return '重要だが緊急でない';
    if (urgent && !important) return '緊急だが重要でない';
    return '重要でも緊急でもない';
  }

  private calculateAverageCompletionTime(tasks: Task[]): number {
    // 平均完了時間の計算ロジック
    // TODO: より高度な分析を実装
    return 0;
  }

  private findCommonCategories(tasks: Task[]): string[] {
    // 一般的なカテゴリ検出のロジック
    // TODO: より高度な分析を実装
    return [];
  }

  private findFrequentCollaborators(tasks: Task[]): string[] {
    // 頻繁な共同作業者の検出ロジック
    // TODO: より高度な分析を実装
    return [];
  }

  private calculateCurrentWorkload(tasks: Task[]): number {
    // 現在の作業負荷の計算ロジック
    // TODO: より高度な分析を実装
    return 0;
  }

  private countOverdueTasks(tasks: Task[]): number {
    // 期限切れタスクのカウントロジック
    // TODO: より高度な分析を実装
    return 0;
  }

  private countUpcomingDeadlines(tasks: Task[]): number {
    // 近づく期限のカウントロジック
    // TODO: より高度な分析を実装
    return 0;
  }

  private generatePriorityRecommendations(tasks: Task[]): string[] {
    // 優先度の推奨生成のロジック
    // TODO: より高度な分析を実装
    return [];
  }

  private generateResourceRecommendations(tasks: Task[]): string[] {
    // リソース配分の推奨生成のロジック
    // TODO: より高度な分析を実装
    return [];
  }

  private generateTimelineRecommendations(tasks: Task[]): string[] {
    // タイムライン最適化の推奨生成のロジック
    // TODO: より高度な分析を実装
    return [];
  }

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
    // タスクパターンの分析ロジック
    // TODO: より高度な分析を実装
    return tasks;
  }
} 