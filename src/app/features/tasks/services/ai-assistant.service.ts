import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
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

  private readonly importanceKeywords = {
    '高': ['緊急', '重要', '必須', '期限切れ', '優先'],
    '中': ['計画', '戦略', '改善', '成長', '投資'],
    '低': ['依頼', '対応', '確認', '連絡', '報告']
  };

  constructor(private firestore: Firestore) {}

  async analyzeTask(task: Task): Promise<AISuggestion> {
    // タスクの分析と提案を生成
    const category = await this.suggestCategory(task.title, task.description);
    const importance = this.calculateImportance(task);
    const dueDate = this.suggestDueDate(task);
    const relatedTasks = await this.findRelatedTasks(task);
    const actionPlan = this.generateActionPlan(task);

    return {
      category,
      importance,
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
    // タスク履歴の分析
    const tasksRef = collection(this.firestore, 'tasks');
    const q = query(tasksRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const tasks = querySnapshot.docs.map(doc => doc.data() as Task);
    
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
  }

  private async suggestCategory(title: string, description: string): Promise<string> {
    // カテゴリ提案のロジック
    // TODO: より高度な分析を実装
    return '技術的課題';
  }

  private calculateImportance(task: Task): '低' | '中' | '高' {
    // 重要度計算のロジック
    // TODO: より高度な分析を実装
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

  private determineQuadrant(urgent: boolean, important: boolean): EisenhowerMatrix['quadrant'] {
    if (urgent && important) return '重要かつ緊急';
    if (!urgent && important) return '重要だが緊急でない';
    if (urgent && !important) return '緊急だが重要でない';
    return '重要でも緊急でもない';
  }

  private calculateAverageCompletionTime(tasks: Task[]): number {
    // 平均完了時間計算のロジック
    // TODO: より高度な分析を実装
    return 0;
  }

  private findCommonCategories(tasks: Task[]): string[] {
    // 一般的なカテゴリ検出のロジック
    // TODO: より高度な分析を実装
    return [];
  }

  private findFrequentCollaborators(tasks: Task[]): string[] {
    // 頻繁な協力者検出のロジック
    // TODO: より高度な分析を実装
    return [];
  }

  private calculateCurrentWorkload(tasks: Task[]): number {
    // 現在の作業負荷計算のロジック
    // TODO: より高度な分析を実装
    return 0;
  }

  private countOverdueTasks(tasks: Task[]): number {
    // 期限切れタスクカウントのロジック
    // TODO: より高度な分析を実装
    return 0;
  }

  private countUpcomingDeadlines(tasks: Task[]): number {
    // 近い期限のタスクカウントのロジック
    // TODO: より高度な分析を実装
    return 0;
  }

  private generatePriorityRecommendations(tasks: Task[]): string[] {
    // 優先度調整の推奨生成のロジック
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

  // Eisenhower Matrixに基づいて重要度を設定
  setImportance(task: Task): '高' | '中' | '低' {
    const title = task.title.toLowerCase();
    const description = task.description?.toLowerCase() || '';
    for (const [importance, keywords] of Object.entries(this.importanceKeywords)) {
      if (keywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      )) {
        return importance as '高' | '中' | '低';
      }
    }
    return '中';
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
        importance: pattern.importance,
        dueDate: new Date(),
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

  private analyzeTaskPatterns(tasks: Task[]): Array<{
    title: string;
    description: string;
    category: string;
    importance: '高' | '中' | '低';
  }> {
    const patterns: Array<{
      title: string;
      description: string;
      category: string;
      importance: '高' | '中' | '低';
    }> = [];
    
    // 単純な頻度分析
    const categoryCount = new Map<string, number>();
    const importanceCount = new Map<string, number>();
    
    tasks.forEach(task => {
      categoryCount.set(task.category, (categoryCount.get(task.category) || 0) + 1);
      importanceCount.set(task.importance, (importanceCount.get(task.importance) || 0) + 1);
    });

    // 最も頻出するカテゴリと重要度の組み合わせを返す
    const mostCommonCategory = [...categoryCount.entries()]
      .sort((a, b) => b[1] - a[1])[0][0];
    const mostCommonImportance = [...importanceCount.entries()]
      .sort((a, b) => b[1] - a[1])[0][0] as '高' | '中' | '低';

    patterns.push({
      title: '定期的なタスク',
      description: '定期的に発生するタスクを追加',
      category: mostCommonCategory,
      importance: mostCommonImportance
    });

    return patterns;
  }
} 