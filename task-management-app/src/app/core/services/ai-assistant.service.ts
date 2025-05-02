import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where } from '@angular/fire/firestore';
import { Task } from '../../features/tasks/models/task.model';
import { AISuggestion } from '../models/ai-assistant.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  private readonly COLLECTION_SUGGESTIONS = 'ai_suggestions';
  private readonly API_ENDPOINT = environment.aiApiEndpoint;
  private readonly API_KEY = environment.aiApiKey;

  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.API_KEY}`
  });

  constructor(
    private firestore: Firestore,
    private http: HttpClient
  ) {}

  async analyzeTask(task: Task): Promise<AISuggestion> {
    try {
      // タスクの分析を実行
      const analysis = await this.analyzeTaskWithAI(task);
      
      // 推奨事項を生成
      const suggestions = this.generateSuggestions(task, analysis);
      
      // 分析結果を保存
      await this.saveSuggestion(task.id, suggestions);
      
      return suggestions;
    } catch (error) {
      console.error('タスク分析に失敗しました:', error);
      throw error;
    }
  }

  private async analyzeTaskWithAI(task: Task): Promise<any> {
    try {
      const response = await this.http.post<any>(
        `${this.API_ENDPOINT}/analyze`,
        {
          task: task,
          context: {
            userPreferences: await this.getUserPreferences(),
            historicalData: await this.getHistoricalData()
          }
        },
        { headers: this.headers }
      ).toPromise();

      if (!response) {
        throw new Error('AI分析のレスポンスが空です');
      }

      return response;
    } catch (error) {
      console.error('AI分析に失敗しました:', error);
      throw error;
    }
  }

  private generateSuggestions(task: Task, analysis: any): AISuggestion {
    // 優先度の調整
    const priorityAdjustments = this.generatePrioritySuggestions(task, analysis);
    
    // リソース配分の提案
    const resourceAllocation = this.generateResourceSuggestions(task, analysis);
    
    // タイムライン最適化
    const timelineOptimization = this.generateTimelineSuggestions(task, analysis);
    
    // タスク管理の提案
    const taskManagement = this.generateTaskManagementSuggestions(task, analysis);
    
    // 共同作業の提案
    const collaboration = this.generateCollaborationSuggestions(task, analysis);
    
    // アクションプランの生成
    const actionPlan = this.generateActionPlan(
      priorityAdjustments,
      resourceAllocation,
      timelineOptimization,
      taskManagement,
      collaboration
    );

    return {
      category: task.category,
      priority: task.priority,
      suggestedDueDate: task.dueDate ? (task.dueDate instanceof Date ? task.dueDate : task.dueDate.toDate()) : null,
      relatedTasks: analysis.relatedTasks || [],
      confidence: analysis.confidence || 0.8,
      lastUpdated: new Date(),
      priorityAdjustments,
      resourceAllocation,
      timelineOptimization,
      taskManagement,
      collaboration,
      actionPlan,
      eisenhowerMatrix: this.calculateEisenhowerMatrix(task, analysis),
      analysis: {
        historicalData: analysis.historicalData,
        currentStatus: analysis.currentStatus
      }
    };
  }

  private generatePrioritySuggestions(task: Task, analysis: any): string[] {
    const suggestions: string[] = [];
    
    // 期限に基づく優先度調整
    if (task.dueDate) {
      const dueDate = task.dueDate instanceof Date ? task.dueDate : task.dueDate.toDate();
      const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 3 && task.priority !== '高') {
        suggestions.push('期限が迫っているため、優先度を「高」に上げることを推奨します');
      }
    }

    // 依存関係に基づく優先度調整
    if (task.dependencies && task.dependencies.length > 0) {
      suggestions.push('他のタスクに依存しているため、優先度を上げることを検討してください');
    }

    return suggestions;
  }

  private generateResourceSuggestions(task: Task, analysis: any): string[] {
    const suggestions: string[] = [];
    
    // 必要なスキルに基づくリソース配分
    if (analysis.requiredSkills && analysis.requiredSkills.length > 0) {
      suggestions.push(`必要なスキル: ${analysis.requiredSkills.join(', ')}を持つメンバーをアサインすることを推奨します`);
    }

    // 複雑度に基づくリソース配分
    if (analysis.complexity > 0.7) {
      suggestions.push('タスクの複雑度が高いため、複数のメンバーでの対応を検討してください');
    }

    return suggestions;
  }

  private generateTimelineSuggestions(task: Task, analysis: any): string[] {
    const suggestions: string[] = [];
    
    // 推定時間に基づくタイムライン調整
    if (analysis.estimatedTime) {
      const hours = Math.ceil(analysis.estimatedTime / 60);
      suggestions.push(`推定所要時間: ${hours}時間。スケジュールの調整を検討してください`);
    }

    // 依存関係に基づくタイムライン調整
    if (task.dependencies && task.dependencies.length > 0) {
      suggestions.push('依存タスクの完了を待ってから開始することを推奨します');
    }

    return suggestions;
  }

  private generateTaskManagementSuggestions(task: Task, analysis: any): string[] {
    const suggestions: string[] = [];
    
    // サブタスクの提案
    if (analysis.complexity > 0.5) {
      suggestions.push('タスクを小さなサブタスクに分割することを推奨します');
    }

    // 進捗管理の提案
    if (analysis.estimatedTime > 240) { // 4時間以上
      suggestions.push('定期的な進捗確認を設定することを推奨します');
    }

    return suggestions;
  }

  private generateCollaborationSuggestions(task: Task, analysis: any): string[] {
    const suggestions: string[] = [];
    
    // チームサイズの提案
    if (analysis.complexity > 0.6) {
      suggestions.push('チームでの対応を検討してください');
    }

    // コミュニケーションツールの提案
    if (analysis.requiredSkills && analysis.requiredSkills.length > 1) {
      suggestions.push('専門知識を持つメンバーとの定期的なコミュニケーションを推奨します');
    }

    return suggestions;
  }

  private generateActionPlan(
    priorityAdjustments: string[],
    resourceAllocation: string[],
    timelineOptimization: string[],
    taskManagement: string[],
    collaboration: string[]
  ): string[] {
    const actionPlan: string[] = [];
    
    // 優先度調整のアクション
    if (priorityAdjustments.length > 0) {
      actionPlan.push('1. 優先度の再評価と調整');
    }

    // リソース配分のアクション
    if (resourceAllocation.length > 0) {
      actionPlan.push('2. 必要なリソースの確保と配分');
    }

    // タイムライン最適化のアクション
    if (timelineOptimization.length > 0) {
      actionPlan.push('3. スケジュールの調整と依存関係の確認');
    }

    // タスク管理のアクション
    if (taskManagement.length > 0) {
      actionPlan.push('4. タスクの分割と進捗管理の設定');
    }

    // 共同作業のアクション
    if (collaboration.length > 0) {
      actionPlan.push('5. チームメンバーとのコミュニケーション計画の作成');
    }

    return actionPlan;
  }

  private calculateEisenhowerMatrix(task: Task, analysis: any): {
    urgent: boolean;
    important: boolean;
    quadrant: '重要かつ緊急' | '重要だが緊急でない' | '緊急だが重要でない' | '重要でも緊急でもない';
  } {
    const isUrgent = task.dueDate ? 
      (task.dueDate instanceof Date ? task.dueDate : task.dueDate.toDate()).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000 : 
      false;
    
    const isImportant = task.priority === '高' || 
      (analysis.requiredSkills && analysis.requiredSkills.length > 0) ||
      (task.dependencies && task.dependencies.length > 0);

    let quadrant: '重要かつ緊急' | '重要だが緊急でない' | '緊急だが重要でない' | '重要でも緊急でもない';
    
    if (isImportant && isUrgent) {
      quadrant = '重要かつ緊急';
    } else if (isImportant && !isUrgent) {
      quadrant = '重要だが緊急でない';
    } else if (!isImportant && isUrgent) {
      quadrant = '緊急だが重要でない';
    } else {
      quadrant = '重要でも緊急でもない';
    }

    return {
      urgent: isUrgent,
      important: isImportant,
      quadrant
    };
  }

  getSuggestions(taskId: string): Observable<AISuggestion | null> {
    return from(this.getSuggestionsFromFirestore(taskId)).pipe(
      map(suggestion => {
        if (!suggestion || this.isSuggestionOutdated(suggestion)) {
          return null;
        }
        return suggestion;
      }),
      catchError(error => {
        console.error('推奨事項の取得に失敗しました:', error);
        return [null];
      })
    );
  }

  private async getSuggestionsFromFirestore(taskId: string): Promise<AISuggestion | null> {
    try {
      const suggestionsRef = collection(this.firestore, this.COLLECTION_SUGGESTIONS);
      const q = query(
        suggestionsRef,
        where('taskId', '==', taskId)
      );
      const snapshot = await getDocs(q);
      const suggestions = snapshot.docs.map(doc => doc.data() as AISuggestion);
      return suggestions[0] || null;
    } catch (error) {
      console.error('Firestoreからの推奨事項取得に失敗しました:', error);
      return null;
    }
  }

  private isSuggestionOutdated(suggestion: AISuggestion): boolean {
    const oneDay = 24 * 60 * 60 * 1000;
    return Date.now() - suggestion.lastUpdated.getTime() > oneDay;
  }

  private async getUserPreferences(): Promise<any> {
    try {
      const preferencesRef = collection(this.firestore, 'user_preferences');
      const q = query(preferencesRef);
      const snapshot = await getDocs(q);
      return snapshot.docs[0]?.data() || {};
    } catch (error) {
      console.error('ユーザー設定の取得に失敗しました:', error);
      return {};
    }
  }

  private async getHistoricalData(): Promise<any> {
    try {
      const tasksRef = collection(this.firestore, 'tasks');
      const q = query(tasksRef);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('履歴データの取得に失敗しました:', error);
      return [];
    }
  }

  private async saveSuggestion(taskId: string, suggestion: AISuggestion): Promise<void> {
    try {
      const suggestionsRef = collection(this.firestore, this.COLLECTION_SUGGESTIONS);
      await addDoc(suggestionsRef, {
        taskId,
        ...suggestion,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('推奨事項の保存に失敗しました:', error);
      throw error;
    }
  }
} 