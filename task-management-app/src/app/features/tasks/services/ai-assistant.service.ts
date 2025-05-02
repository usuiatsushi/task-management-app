import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, CollectionReference, Query } from '@angular/fire/firestore';
import { AISuggestion, EisenhowerMatrix, TaskAnalysis } from '../models/ai-assistant.model';
import { Task } from '../models/task.model';
import { Observable, of, catchError } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { ErrorHandler } from '../utils/error-handler';
import { 
  TaskAnalysisError, 
  TaskCategoryError, 
  TaskPriorityError,
  FirestoreError,
  ValidationError
} from '../models/ai-assistant.error';
import { ERROR_MESSAGES } from '../constants/error-messages';

@Injectable()
export class AiAssistantService {
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分
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

  private cache: {
    [key: string]: {
      data: any;
      timestamp: number;
    };
  } = {};

  constructor(
    private firestore: Firestore,
    private errorHandler: ErrorHandler
  ) {}

  private getCacheKey(method: string, params: any): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache[key];
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache[key] = {
      data,
      timestamp: Date.now()
    };
  }

  private clearCache(): void {
    this.cache = {};
  }

  // タスクのバリデーション
  private validateTask(task: Task): void {
    if (!task.title?.trim()) {
      throw new ValidationError(ERROR_MESSAGES.TASK_VALIDATION.INVALID_TITLE);
    }
    if (!task.description?.trim()) {
      throw new ValidationError(ERROR_MESSAGES.TASK_VALIDATION.INVALID_DESCRIPTION);
    }
    if (!task.dueDate) {
      throw new ValidationError(ERROR_MESSAGES.TASK_VALIDATION.INVALID_DUE_DATE);
    }
  }

  // タスクのカテゴリを自動分類
  categorizeTask(task: Task): string {
    try {
      this.validateTask(task);
      
      const cacheKey = this.getCacheKey('categorizeTask', { title: task.title, description: task.description });
      const cached = this.getFromCache<string>(cacheKey);
      if (cached) return cached;
      
      const title = task.title.toLowerCase();
      const description = task.description?.toLowerCase() || '';

      for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
        if (keywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword)
        )) {
          this.setCache(cacheKey, category);
          return category;
        }
      }

      const result = 'その他';
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new TaskCategoryError(ERROR_MESSAGES.TASK_ANALYSIS.CATEGORY_ANALYSIS_FAILED, error);
    }
  }

  // タスクの優先度を自動設定
  calculatePriority(task: Task): '低' | '中' | '高' {
    try {
      this.validateTask(task);
      
      const cacheKey = this.getCacheKey('calculatePriority', { title: task.title, description: task.description });
      const cached = this.getFromCache<'低' | '中' | '高'>(cacheKey);
      if (cached) return cached;
      
      const title = task.title.toLowerCase();
      const description = task.description?.toLowerCase() || '';

      for (const [priority, keywords] of Object.entries(this.priorityKeywords)) {
        if (keywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword)
        )) {
          this.setCache(cacheKey, priority);
          return priority as '低' | '中' | '高';
        }
      }

      const result = '中';
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new TaskPriorityError(ERROR_MESSAGES.TASK_ANALYSIS.PRIORITY_ANALYSIS_FAILED, error);
    }
  }

  // タスクの分析と提案を生成
  async analyzeTask(task: Task): Promise<AISuggestion> {
    try {
      this.validateTask(task);

      const cacheKey = this.getCacheKey('analyzeTask', { 
        id: task.id, 
        title: task.title, 
        description: task.description 
      });
      const cached = this.getFromCache<AISuggestion>(cacheKey);
      if (cached) return cached;

      // カテゴリと優先度の分析
      const category = this.categorizeTask(task);
      const priority = this.calculatePriority(task);

      // 期限の提案
      const today = new Date();
      let suggestedDueDate = new Date(today);
      
      // 優先度に基づく期限の提案
      switch (priority) {
        case '高':
          suggestedDueDate.setDate(today.getDate() + 3);
          break;
        case '中':
          suggestedDueDate.setDate(today.getDate() + 7);
          break;
        case '低':
          suggestedDueDate.setDate(today.getDate() + 14);
          break;
      }

      // 関連タスクの検索
      const relatedTasks: string[] = [];
      try {
        const tasksRef = collection(this.firestore, 'tasks') as CollectionReference<Task>;
        const q = query(
          tasksRef,
          where('category', '==', category),
          where('completed', '==', false)
        ) as Query<Task>;
        
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
          const relatedTask = doc.data();
          if (relatedTask.id !== task.id) {
            relatedTasks.push(`${relatedTask.title} (${relatedTask.status})`);
          }
        });
      } catch (error) {
        throw new FirestoreError(ERROR_MESSAGES.FIRESTORE.QUERY_FAILED, error);
      }

      // アクションプランの生成
      const actionPlan = this.generateActionPlan(category);

      const result = {
        category,
        priority,
        suggestedDueDate,
        relatedTasks,
        actionPlan
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.errorHandler.handleError(error);
      throw new TaskAnalysisError(ERROR_MESSAGES.TASK_ANALYSIS.ACTION_PLAN_GENERATION_FAILED, error);
    }
  }

  // アクションプランの生成
  private generateActionPlan(category: string): string[] {
    const actionPlan: string[] = [];
    
    switch (category) {
      case '仕事':
        actionPlan.push('1. 必要な資料・情報の収集');
        actionPlan.push('2. 関係者との打ち合わせ');
        actionPlan.push('3. タスクの実行計画の作成');
        actionPlan.push('4. 進捗報告の準備');
        break;
      case '学習':
        actionPlan.push('1. 学習目標の設定');
        actionPlan.push('2. 学習リソースの準備');
        actionPlan.push('3. 学習スケジュールの作成');
        actionPlan.push('4. 復習計画の立案');
        break;
      case '健康':
        actionPlan.push('1. 目標値・指標の設定');
        actionPlan.push('2. 実施スケジュールの作成');
        actionPlan.push('3. 進捗記録の方法決定');
        actionPlan.push('4. 定期的な見直し計画');
        break;
      case 'プライベート':
        actionPlan.push('1. 必要な準備の洗い出し');
        actionPlan.push('2. スケジュール調整');
        actionPlan.push('3. 必要な予約・手配');
        actionPlan.push('4. 関係者への連絡');
        break;
      default:
        actionPlan.push('1. タスクの詳細な内容確認');
        actionPlan.push('2. 必要なリソースの確認');
        actionPlan.push('3. スケジュールの作成');
        actionPlan.push('4. 実行計画の立案');
    }

    return actionPlan;
  }

  // アイゼンハワーマトリックスによる分析
  async analyzeTaskMatrix(task: Task): Promise<EisenhowerMatrix> {
    try {
      this.validateTask(task);

      const title = task.title.toLowerCase();
      const description = task.description?.toLowerCase() || '';

      // 緊急性の判定
      const urgentKeywords = ['緊急', '至急', '今すぐ', '期限切れ', '今日中', '明日まで'];
      const urgent = urgentKeywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      );

      // 重要性の判定
      const importantKeywords = ['重要', '必須', '重大', '戦略', 'クリティカル', '優先'];
      const important = importantKeywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      ) || task.priority === '高';

      // 期限による緊急性の判定
      const today = new Date();
      const taskDueDate = this.getTaskDueDate(task) || today;

      const daysUntilDue = Math.ceil((taskDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isUrgentByDate = daysUntilDue <= 3;

      const isUrgent = urgent || isUrgentByDate;

      // 象限の決定
      let quadrant: '重要かつ緊急' | '重要だが緊急でない' | '緊急だが重要でない' | '重要でも緊急でもない';
      if (important && isUrgent) quadrant = '重要かつ緊急';
      else if (important && !isUrgent) quadrant = '重要だが緊急でない';
      else if (!important && isUrgent) quadrant = '緊急だが重要でない';
      else quadrant = '重要でも緊急でもない';

      return {
        urgent: isUrgent,
        important,
        quadrant
      };
    } catch (error) {
      this.errorHandler.handleError(error);
      throw new TaskAnalysisError(ERROR_MESSAGES.TASK_ANALYSIS.MATRIX_ANALYSIS_FAILED, error);
    }
  }

  // タスク履歴の分析
  async analyzeTaskHistory(userId: string): Promise<TaskAnalysis> {
    try {
      if (!userId?.trim()) {
        throw new ValidationError('ユーザーIDが無効です');
      }

      const tasksRef = collection(this.firestore, 'tasks') as CollectionReference<Task>;
      const q = query(
        tasksRef,
        where('userId', '==', userId)
      ) as Query<Task>;
      
      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs.map(doc => doc.data());

      // 完了したタスクの平均完了時間を計算
      const completedTasks = tasks.filter(task => task.completed);
      const averageCompletionTime = completedTasks.length > 0
        ? completedTasks.reduce((sum, task) => {
            const startDate = task.createdAt.toDate();
            const endDate = task.updatedAt.toDate();
            const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / completedTasks.length
        : 0;

      // カテゴリの頻度分析
      const categoryCounts = tasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const commonCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category]) => category);

      // 協力者の頻度分析
      const collaboratorCounts = tasks.reduce((acc, task) => {
        if (task.assignedTo) {
          acc[task.assignedTo] = (acc[task.assignedTo] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      const frequentCollaborators = Object.entries(collaboratorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([collaborator]) => collaborator);

      // 現在の作業負荷分析
      const now = new Date();
      const activeTasks = tasks.filter(task => !task.completed);
      const overdueTasks = activeTasks.filter(task => {
        const dueDate = this.getTaskDueDate(task);
        return dueDate && dueDate < now;
      });
      const upcomingDeadlines = activeTasks.filter(task => {
        const dueDate = this.getTaskDueDate(task);
        return dueDate && dueDate > now && (dueDate.getTime() - now.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      });

      // 推奨事項の生成
      const recommendations = this.generateRecommendations(
        activeTasks.length,
        overdueTasks.length,
        upcomingDeadlines.length,
        averageCompletionTime
      );

      return {
        historicalData: {
          averageCompletionTime,
          commonCategories,
          frequentCollaborators
        },
        currentStatus: {
          workload: Math.min(100, (activeTasks.length / 20) * 100), // 20タスクを最大負荷として計算
          overdueTasks: overdueTasks.length,
          upcomingDeadlines: upcomingDeadlines.length
        },
        recommendations
      };
    } catch (error) {
      this.errorHandler.handleError(error);
      throw new TaskAnalysisError(ERROR_MESSAGES.TASK_ANALYSIS.HISTORY_ANALYSIS_FAILED, error);
    }
  }

  private generateRecommendations(
    activeTaskCount: number,
    overdueTaskCount: number,
    upcomingDeadlineCount: number,
    averageCompletionTime: number
  ): {
    priorityAdjustments: string[];
    resourceAllocation: string[];
    timelineOptimization: string[];
  } {
    const recommendations = {
      priorityAdjustments: [] as string[],
      resourceAllocation: [] as string[],
      timelineOptimization: [] as string[]
    };

    // 優先度調整の推奨
    if (overdueTaskCount > 0) {
      recommendations.priorityAdjustments.push(
        `${overdueTaskCount}件の期限切れタスクがあります。優先度の見直しを検討してください。`
      );
    }
    if (upcomingDeadlineCount > 5) {
      recommendations.priorityAdjustments.push(
        '近い期限のタスクが多数あります。優先順位の再評価を推奨します。'
      );
    }

    // リソース配分の推奨
    if (activeTaskCount > 15) {
      recommendations.resourceAllocation.push(
        '現在の作業負荷が高くなっています。タスクの委譲や再配分を検討してください。'
      );
    }
    if (averageCompletionTime > 7) {
      recommendations.resourceAllocation.push(
        'タスクの完了に時間がかかっています。リソースの追加配分を検討してください。'
      );
    }

    // タイムライン最適化の推奨
    if (upcomingDeadlineCount > 0) {
      recommendations.timelineOptimization.push(
        '近い期限のタスクがあります。スケジュールの調整を推奨します。'
      );
    }
    if (averageCompletionTime > 5) {
      recommendations.timelineOptimization.push(
        'タスクの完了に時間がかかっています。タイムラインの見直しを推奨します。'
      );
    }

    return recommendations;
  }

  // 過去のタスク履歴に基づいてサジェストを提供
  suggestTasks(previousTasks: Task[]): Observable<Task[]> {
    try {
      if (!Array.isArray(previousTasks)) {
        throw new ValidationError('タスクリストが無効です');
      }

      const suggestions: Task[] = [];
      const taskPatterns = this.analyzeTaskPatterns(previousTasks);
      
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

      return of(suggestions).pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          return this.errorHandler.asObservableError(error);
        })
      );
    } catch (error) {
      this.errorHandler.handleError(error);
      return this.errorHandler.asObservableError(error);
    }
  }

  private analyzeTaskPatterns(previousTasks: Task[]): Task[] {
    const patterns: Task[] = [];
    const now = new Date();

    // カテゴリごとのパターン分析
    const categoryPatterns = this.analyzeCategoryPatterns(previousTasks);
    patterns.push(...categoryPatterns);

    // 期限に基づくパターン分析
    const deadlinePatterns = this.analyzeDeadlinePatterns(previousTasks);
    patterns.push(...deadlinePatterns);

    // 優先度に基づくパターン分析
    const priorityPatterns = this.analyzePriorityPatterns(previousTasks);
    patterns.push(...priorityPatterns);

    // 重複を除去
    return this.removeDuplicatePatterns(patterns);
  }

  private analyzeCategoryPatterns(tasks: Task[]): Task[] {
    const patterns: Task[] = [];
    const categoryGroups = tasks.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = [];
      }
      acc[task.category].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    for (const [category, categoryTasks] of Object.entries(categoryGroups)) {
      if (categoryTasks.length >= 3) {
        // カテゴリ内で頻出する単語を抽出
        const commonWords = this.extractCommonWords(categoryTasks);
        
        // 新しいタスクパターンを生成
        const pattern: Task = {
          id: '',
          title: `${category}の${commonWords[0]}に関するタスク`,
          description: `${category}の${commonWords[0]}についての詳細な作業が必要です。`,
          category,
          priority: this.calculateCategoryPriority(categoryTasks),
          dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
          completed: false,
          status: '未着手',
          assignedTo: '',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          userId: ''
        };
        patterns.push(pattern);
      }
    }

    return patterns;
  }

  private analyzeDeadlinePatterns(tasks: Task[]): Task[] {
    const patterns: Task[] = [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 最近の期限パターンを分析
    const recentTasks = tasks.filter(task => {
      const dueDate = this.getTaskDueDate(task);
      return dueDate && dueDate >= oneWeekAgo && dueDate <= oneWeekLater;
    });

    if (recentTasks.length >= 2) {
      const commonCategory = this.findMostCommonCategory(recentTasks);
      const pattern: Task = {
        id: '',
        title: `${commonCategory}の定期的な確認タスク`,
        description: `${commonCategory}の進捗状況を確認し、必要なアクションを特定します。`,
        category: commonCategory,
        priority: '中',
        dueDate: Timestamp.fromDate(oneWeekLater),
        completed: false,
        status: '未着手',
        assignedTo: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: ''
      };
      patterns.push(pattern);
    }

    return patterns;
  }

  private analyzePriorityPatterns(tasks: Task[]): Task[] {
    const patterns: Task[] = [];
    const priorityGroups = tasks.reduce((acc, task) => {
      if (!acc[task.priority]) {
        acc[task.priority] = [];
      }
      acc[task.priority].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    for (const [priority, priorityTasks] of Object.entries(priorityGroups)) {
      if (priorityTasks.length >= 3) {
        const commonCategory = this.findMostCommonCategory(priorityTasks);
        const pattern: Task = {
          id: '',
          title: `${commonCategory}の${priority}優先度タスク`,
          description: `${commonCategory}に関する重要な作業が必要です。`,
          category: commonCategory,
          priority: priority as '低' | '中' | '高',
          dueDate: Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
          completed: false,
          status: '未着手',
          assignedTo: '',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          userId: ''
        };
        patterns.push(pattern);
      }
    }

    return patterns;
  }

  private extractCommonWords(tasks: Task[]): string[] {
    const words = tasks.flatMap(task => {
      const titleWords = task.title.split(/\s+/);
      const descWords = task.description?.split(/\s+/) || [];
      return [...titleWords, ...descWords];
    });

    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word);
  }

  private calculateCategoryPriority(tasks: Task[]): '低' | '中' | '高' {
    const priorityCounts = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const maxPriority = Object.entries(priorityCounts)
      .sort(([, a], [, b]) => b - a)[0][0];

    return maxPriority as '低' | '中' | '高';
  }

  private findMostCommonCategory(tasks: Task[]): string {
    const categoryCounts = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)[0][0];
  }

  private removeDuplicatePatterns(patterns: Task[]): Task[] {
    const uniquePatterns = new Map<string, Task>();
    patterns.forEach(pattern => {
      const key = `${pattern.category}-${pattern.priority}-${pattern.title}`;
      if (!uniquePatterns.has(key)) {
        uniquePatterns.set(key, pattern);
      }
    });
    return Array.from(uniquePatterns.values());
  }

  private convertTimestampToDate(timestamp: Timestamp | null): Date | null {
    if (!timestamp) return null;
    return timestamp.toDate();
  }

  private convertDateToTimestamp(date: Date | null): Timestamp | null {
    if (!date) return null;
    return Timestamp.fromDate(date);
  }

  private getTaskDueDate(task: Task): Date | null {
    if (!task.dueDate) return null;
    return this.convertTimestampToDate(task.dueDate);
  }

  private calculateTaskPriority(task: Task): '低' | '中' | '高' {
    const dueDate = this.getTaskDueDate(task);
    if (!dueDate) return '中';

    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysUntilDue = timeDiff / (1000 * 60 * 60 * 24);

    if (daysUntilDue <= 1) return '高';
    if (daysUntilDue <= 3) return '中';
    return '低';
  }
} 