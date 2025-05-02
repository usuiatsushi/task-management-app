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

  constructor(
    private firestore: Firestore,
    private errorHandler: ErrorHandler
  ) {}

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

      return {
        category,
        priority,
        suggestedDueDate,
        relatedTasks,
        actionPlan
      };
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
      let taskDueDate: Date;
      
      if (!task.dueDate) {
        taskDueDate = today;
      } else if (task.dueDate instanceof Timestamp) {
        taskDueDate = task.dueDate.toDate();
      } else if (task.dueDate instanceof Date) {
        taskDueDate = task.dueDate;
      } else if (typeof task.dueDate === 'string') {
        taskDueDate = new Date(task.dueDate);
      } else {
        taskDueDate = new Date(task.dueDate.seconds * 1000);
      }

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
    } catch (error) {
      this.errorHandler.handleError(error);
      throw new TaskAnalysisError(ERROR_MESSAGES.TASK_ANALYSIS.HISTORY_ANALYSIS_FAILED, error);
    }
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

  private analyzeTaskPatterns(tasks: Task[]): Task[] {
    return tasks;
  }
} 