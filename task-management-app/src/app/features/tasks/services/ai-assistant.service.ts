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
  private readonly MAX_CACHE_SIZE = 100; // 最大キャッシュ数
  private cache: Map<string, {
    data: any;
    timestamp: number;
    accessCount: number;
  }> = new Map();

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

  private readonly ERROR_RETRY_COUNT = 3;
  private readonly ERROR_RETRY_DELAY = 1000; // 1秒

  private getCacheKey(method: string, params: any): string {
    // パラメータを文字列化する際の最適化
    const paramString = typeof params === 'object' 
      ? JSON.stringify(params, Object.keys(params).sort())
      : String(params);
    return `${method}:${paramString}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached) {
      // アクセス回数を更新
      cached.accessCount++;
      
      // キャッシュが有効期限内かチェック
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data as T;
      } else {
        // 期限切れのキャッシュを削除
        this.cache.delete(key);
      }
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    // キャッシュサイズが上限に達している場合、最も使用頻度の低いキャッシュを削除
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const leastAccessed = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.accessCount - b.accessCount)[0];
      this.cache.delete(leastAccessed[0]);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 0
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  // 定期的なキャッシュクリーンアップ
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.CACHE_DURATION) {
          this.cache.delete(key);
        }
      }
    }, 60 * 1000); // 1分ごとに実行
  }

  constructor(
    private firestore: Firestore,
    private errorHandler: ErrorHandler
  ) {
    this.startCacheCleanup();
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
  async categorizeTask(task: Task): Promise<string> {
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
  async calculatePriority(task: Task): Promise<'低' | '中' | '高'> {
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

  // 推奨期限を計算
  async calculateSuggestedDueDate(priority: '低' | '中' | '高'): Promise<Date> {
    const today = new Date();
    const suggestedDueDate = new Date(today);
    
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
    
    return suggestedDueDate;
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < this.ERROR_RETRY_COUNT; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`[${context}] リトライ ${i + 1}/${this.ERROR_RETRY_COUNT}:`, error);
        
        if (i < this.ERROR_RETRY_COUNT - 1) {
          await new Promise(resolve => setTimeout(resolve, this.ERROR_RETRY_DELAY));
        }
      }
    }
    
    throw lastError;
  }

  private handleFirestoreError(error: Error, context: string): never {
    if (error.name === 'FirebaseError') {
      const firebaseError = error as any;
      switch (firebaseError.code) {
        case 'permission-denied':
          throw new FirestoreError('データベースへのアクセス権限がありません', error);
        case 'unavailable':
          throw new FirestoreError('データベースが一時的に利用できません', error);
        case 'cancelled':
          throw new FirestoreError('操作がキャンセルされました', error);
        default:
          throw new FirestoreError(`データベースエラー: ${firebaseError.message}`, error);
      }
    }
    throw new FirestoreError(`${context}中に予期せぬエラーが発生しました`, error);
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

      const category = await this.retryOperation<string>(
        () => this.categorizeTask(task),
        'タスクのカテゴリ分析'
      );
      
      const priority = await this.retryOperation<'低' | '中' | '高'>(
        () => this.calculatePriority(task),
        'タスクの優先度分析'
      );
      
      const suggestedDueDate = await this.retryOperation<Date>(
        () => this.calculateSuggestedDueDate(priority),
        '推奨期限の計算'
      );
      
      const allTasks = await this.getActiveTasks(task.userId);

      // 依存関係の分析を最適化
      const dependencies = this.analyzeTaskDependencies([task, ...allTasks]);
      const taskDependencies = dependencies.get(task.id) || [];
      
      // 類似タスクの検出を最適化
      const similarTasks = this.findSimilarTasks(task, allTasks);
      
      // タスクグループの生成を最適化
      const taskGroups = this.groupRelatedTasks([task, ...allTasks]);
      const taskGroup = taskGroups.find(group => 
        group.some(t => t.id === task.id)
      ) || [];

      const result: AISuggestion = {
        category,
        priority,
        suggestedDueDate,
        relatedTasks: [
          ...taskDependencies.map(id => 
            allTasks.find(t => t.id === id)?.title || ''
          ),
          ...similarTasks.map(t => t.title),
          ...taskGroup
            .filter(t => t.id !== task.id)
            .map(t => t.title)
        ],
        actionPlan: this.generateActionPlan(category, task)
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      if (error instanceof FirestoreError) {
        throw error;
      }
      this.errorHandler.handleError(error);
      throw new TaskAnalysisError(ERROR_MESSAGES.TASK_ANALYSIS.ACTION_PLAN_GENERATION_FAILED, error);
    }
  }

  // アクションプランの生成
  private generateActionPlan(category: string, task: Task): string[] {
    const actionPlan: string[] = [];
    const now = new Date();
    const dueDate = this.getTaskDueDate(task);
    const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // 基本アクションプラン
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

    // 期限に基づく追加アクション
    if (daysUntilDue > 0) {
      if (daysUntilDue <= 3) {
        actionPlan.push('5. 緊急対応の準備');
        actionPlan.push('6. 関係者への緊急連絡');
      } else if (daysUntilDue <= 7) {
        actionPlan.push('5. 中間進捗の確認');
        actionPlan.push('6. 必要に応じた計画の調整');
      } else {
        actionPlan.push('5. 定期的な進捗確認のスケジュール設定');
        actionPlan.push('6. リスク要因の洗い出しと対策');
      }
    }

    // 優先度に基づく追加アクション
    if (task.priority === '高') {
        actionPlan.push('7. 優先度の高いタスクとして、他のタスクとの調整');
        actionPlan.push('8. 必要に応じたリソースの確保');
    } else if (task.priority === '中') {
        actionPlan.push('7. 他のタスクとのバランス調整');
        actionPlan.push('8. リソース配分の最適化');
    } else {
        actionPlan.push('7. 他のタスクの進捗を考慮した実行計画の調整');
        actionPlan.push('8. 必要に応じた優先度の見直し');
    }

    // タスクの説明から具体的なアクションを抽出
    const description = task.description?.toLowerCase() || '';
    if (description.includes('会議')) {
        actionPlan.push('9. 会議の議題と目的の明確化');
        actionPlan.push('10. 必要な資料の準備と配布');
    }
    if (description.includes('報告')) {
        actionPlan.push('9. 報告内容の構成の決定');
        actionPlan.push('10. 必要なデータの収集と分析');
    }
    if (description.includes('開発')) {
        actionPlan.push('9. 開発環境の準備');
        actionPlan.push('10. テスト計画の作成');
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
        averageCompletionTime,
        tasks,
        tasks[0]
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
    averageCompletionTime: number,
    taskHistory: Task[],
    currentTask: Task
  ): {
    priorityAdjustments: string[];
    resourceAllocation: string[];
    timelineOptimization: string[];
    taskManagement: string[];
    collaboration: string[];
  } {
    const recommendations = {
      priorityAdjustments: [] as string[],
      resourceAllocation: [] as string[],
      timelineOptimization: [] as string[],
      taskManagement: [] as string[],
      collaboration: [] as string[]
    };

    // 優先度調整の推奨
    if (overdueTaskCount > 0) {
      recommendations.priorityAdjustments.push(
        `${overdueTaskCount}件の期限切れタスクがあります。優先度の見直しを検討してください。`
      );
      
      // 期限切れタスクの分析
      const overdueTasks = taskHistory.filter(task => {
        const dueDate = this.getTaskDueDate(task);
        return dueDate && dueDate < new Date() && !task.completed;
      });
      
      const overdueCategories = overdueTasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostOverdueCategory = Object.entries(overdueCategories)
        .sort(([, a], [, b]) => b - a)[0];
      
      if (mostOverdueCategory) {
        recommendations.priorityAdjustments.push(
          `${mostOverdueCategory[0]}カテゴリのタスクが${mostOverdueCategory[1]}件期限切れです。特に注意が必要です。`
        );
      }
    }

    if (upcomingDeadlineCount > 5) {
      recommendations.priorityAdjustments.push(
        '近い期限のタスクが多数あります。優先順位の再評価を推奨します。'
      );
      
      // 近い期限のタスクの分析
      const upcomingTasks = taskHistory.filter(task => {
        const dueDate = this.getTaskDueDate(task);
        return dueDate && !task.completed && 
          (dueDate.getTime() - new Date().getTime()) <= 7 * 24 * 60 * 60 * 1000;
      });
      
      const upcomingPriorities = upcomingTasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      if (upcomingPriorities['高'] > 3) {
        recommendations.priorityAdjustments.push(
          '高優先度のタスクが多数あります。リソースの再配分を検討してください。'
        );
      }
    }

    // リソース配分の推奨
    if (activeTaskCount > 15) {
      recommendations.resourceAllocation.push(
        '現在の作業負荷が高くなっています。タスクの委譲や再配分を検討してください。'
      );
      
      // カテゴリごとの負荷分析
      const categoryLoad = taskHistory.reduce((acc, task) => {
        if (!task.completed) {
          acc[task.category] = (acc[task.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const maxLoadCategory = Object.entries(categoryLoad)
        .sort(([, a], [, b]) => b - a)[0];
      
      if (maxLoadCategory && maxLoadCategory[1] > 5) {
        recommendations.resourceAllocation.push(
          `${maxLoadCategory[0]}カテゴリのタスクが${maxLoadCategory[1]}件あり、負荷が集中しています。`
        );
      }
    }

    if (averageCompletionTime > 7) {
      recommendations.resourceAllocation.push(
        'タスクの完了に時間がかかっています。リソースの追加配分を検討してください。'
      );
      
      // 完了時間の長いタスクの分析
      const longTasks = taskHistory.filter(task => {
        if (task.completed && task.createdAt && task.updatedAt) {
          const startDate = task.createdAt.toDate();
          const endDate = task.updatedAt.toDate();
          const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          return days > 7;
        }
        return false;
      });
      
      const longTaskCategories = longTasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostLongCategory = Object.entries(longTaskCategories)
        .sort(([, a], [, b]) => b - a)[0];
      
      if (mostLongCategory) {
        recommendations.resourceAllocation.push(
          `${mostLongCategory[0]}カテゴリのタスクは完了までに時間がかかる傾向があります。`
        );
      }
    }

    // タイムライン最適化の推奨
    if (upcomingDeadlineCount > 0) {
      recommendations.timelineOptimization.push(
        '近い期限のタスクがあります。スケジュールの調整を推奨します。'
      );
      
      // 期限の分布分析
      const deadlineDistribution = taskHistory.reduce((acc, task) => {
        if (!task.completed && task.dueDate) {
          const dueDate = this.getTaskDueDate(task);
          if (dueDate) {
            const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilDue <= 3) acc.immediate++;
            else if (daysUntilDue <= 7) acc.near++;
            else if (daysUntilDue <= 14) acc.mid++;
            else acc.far++;
          }
        }
        return acc;
      }, { immediate: 0, near: 0, mid: 0, far: 0 });
      
      if (deadlineDistribution.immediate > 3) {
        recommendations.timelineOptimization.push(
          '3日以内の期限のタスクが多数あります。緊急のスケジュール調整が必要です。'
        );
      }
    }

    // タスク管理の推奨
    const categoryPatterns = this.analyzeCategoryPatterns(taskHistory);
    if (categoryPatterns.length > 0) {
      recommendations.taskManagement.push(
        '定期的なタスクパターンが見つかりました。テンプレート化を検討してください。'
      );
      
      categoryPatterns.forEach(pattern => {
        recommendations.taskManagement.push(
          `${pattern.category}カテゴリのタスクは「${pattern.title}」のようなパターンが見られます。`
        );
      });
    }

    // 共同作業の推奨
    const collaboratorTasks = taskHistory.filter(task => task.assignedTo);
    if (collaboratorTasks.length > 0) {
      const collaboratorStats = collaboratorTasks.reduce((acc, task) => {
        if (task.assignedTo) {
          acc[task.assignedTo] = (acc[task.assignedTo] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const frequentCollaborators = Object.entries(collaboratorStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
      
      if (frequentCollaborators.length > 0) {
        recommendations.collaboration.push(
          '頻繁に共同作業を行うメンバーがいます。チームワークの強化を検討してください。'
        );
        
        frequentCollaborators.forEach(([collaborator, count]) => {
          recommendations.collaboration.push(
            `${collaborator}さんとは${count}件のタスクで共同作業を行っています。`
          );
        });
      }
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
    if (task.dueDate) {
      if (task.dueDate instanceof Date) {
        return task.dueDate;
      } else if (typeof task.dueDate === 'string') {
        return new Date(task.dueDate);
      } else if (task.dueDate.toDate) {
        return task.dueDate.toDate();
      }
    }
    return null;
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

  private analyzeTaskDependencies(tasks: Task[]): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();
    
    tasks.forEach(task => {
      const taskDependencies: string[] = [];
      
      // タイトルと説明から依存関係を抽出
      const text = `${task.title} ${task.description}`.toLowerCase();
      
      // 依存関係を示すキーワード
      const dependencyKeywords = [
        '依存', '前提', '前準備', '準備', '前段階',
        'after', 'before', 'depends on', 'prerequisite'
      ];
      
      // 他のタスクとの関連性をチェック
      tasks.forEach(otherTask => {
        if (otherTask.id !== task.id) {
          const otherText = `${otherTask.title} ${otherTask.description}`.toLowerCase();
          
          // キーワードベースの依存関係検出
          if (dependencyKeywords.some(keyword => 
            text.includes(keyword) && text.includes(otherTask.title.toLowerCase())
          )) {
            taskDependencies.push(otherTask.id);
          }
          
          // カテゴリと優先度の類似性による関連性検出
          if (task.category === otherTask.category && 
              task.priority === otherTask.priority) {
            taskDependencies.push(otherTask.id);
          }
        }
      });
      
      if (taskDependencies.length > 0) {
        dependencies.set(task.id, taskDependencies);
      }
    });
    
    return dependencies;
  }

  private findSimilarTasks(task: Task, tasks: Task[]): Task[] {
    const similarTasks: Task[] = [];
    const taskText = `${task.title} ${task.description}`.toLowerCase();
    
    // 類似度のしきい値
    const SIMILARITY_THRESHOLD = 0.6;
    
    tasks.forEach(otherTask => {
      if (otherTask.id !== task.id) {
        const otherText = `${otherTask.title} ${otherTask.description}`.toLowerCase();
        
        // テキストの類似度を計算
        const similarity = this.calculateTextSimilarity(taskText, otherText);
        
        if (similarity >= SIMILARITY_THRESHOLD) {
          similarTasks.push(otherTask);
        }
      }
    });
    
    return similarTasks;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // 単語の集合に変換
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    // 共通の単語数を計算
    let commonWords = 0;
    words1.forEach(word => {
      if (words2.has(word)) {
        commonWords++;
      }
    });
    
    // 類似度を計算（Jaccard係数）
    const unionSize = new Set([...words1, ...words2]).size;
    return unionSize > 0 ? commonWords / unionSize : 0;
  }

  private groupRelatedTasks(tasks: Task[]): Task[][] {
    const groups: Task[][] = [];
    const visited = new Set<string>();
    
    tasks.forEach(task => {
      if (!visited.has(task.id)) {
        const group: Task[] = [];
        const queue: Task[] = [task];
        
        while (queue.length > 0) {
          const currentTask = queue.shift()!;
          if (!visited.has(currentTask.id)) {
            visited.add(currentTask.id);
            group.push(currentTask);
            
            // 類似タスクを探してグループに追加
            const similarTasks = this.findSimilarTasks(currentTask, tasks);
            similarTasks.forEach(similarTask => {
              if (!visited.has(similarTask.id)) {
                queue.push(similarTask);
              }
            });
          }
        }
        
        if (group.length > 1) {
          groups.push(group);
        }
      }
    });
    
    return groups;
  }

  // アクティブなタスクを取得するヘルパーメソッド
  private async getActiveTasks(userId: string): Promise<Task[]> {
    const cacheKey = this.getCacheKey('getActiveTasks', { userId });
    const cached = this.getFromCache<Task[]>(cacheKey);
    if (cached) return cached;

    try {
      const tasksRef = collection(this.firestore, 'tasks') as CollectionReference<Task>;
      const q = query(
        tasksRef,
        where('userId', '==', userId),
        where('completed', '==', false)
      ) as Query<Task>;
      
      const querySnapshot = await this.retryOperation(
        () => getDocs(q),
        'アクティブタスクの取得'
      );
      
      const tasks = querySnapshot.docs.map(doc => doc.data());
      this.setCache(cacheKey, tasks);
      return tasks;
    } catch (error) {
      this.handleFirestoreError(error as Error, 'アクティブタスクの取得');
    }
  }
} 