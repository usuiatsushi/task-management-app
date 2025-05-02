import { Injectable } from '@angular/core';
import { Task } from '../models/task.model';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  private readonly categoryKeywords = {
    '仕事': ['仕事', '業務', '会議', '報告', 'プレゼン'],
    'プライベート': ['趣味', '旅行', '買い物', '家族', '友人'],
    '健康': ['運動', 'ジム', '食事', '睡眠', '健康診断'],
    '学習': ['勉強', '読書', '講座', '資格', 'スキル']
  };

  private readonly priorityKeywords = {
    '重要かつ緊急': ['緊急', '重要', '必須', '期限切れ', '優先'],
    '重要だが緊急でない': ['計画', '戦略', '改善', '成長', '投資'],
    '緊急だが重要でない': ['依頼', '対応', '確認', '連絡', '報告'],
    '重要でも緊急でもない': ['趣味', '娯楽', '余暇', 'リラックス', '休息']
  };

  constructor() { }

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

  // Eisenhower Matrixに基づいて優先度を設定
  setPriority(task: Task): string {
    const title = task.title.toLowerCase();
    const description = task.description?.toLowerCase() || '';

    for (const [priority, keywords] of Object.entries(this.priorityKeywords)) {
      if (keywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      )) {
        return priority;
      }
    }

    return '重要だが緊急でない';
  }

  // 過去のタスク履歴に基づいてサジェストを提供
  suggestTasks(previousTasks: Task[]): Observable<Task[]> {
    // TODO: 機械学習モデルを実装して、より高度なサジェストを提供
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
        dueDate: new Date(),
        completed: false
      });
    });

    return of(suggestions);
  }

  private analyzeTaskPatterns(tasks: Task[]): any[] {
    // TODO: より高度なパターン分析を実装
    const patterns: any[] = [];
    
    // 単純な頻度分析
    const categoryCount = new Map<string, number>();
    const priorityCount = new Map<string, number>();
    
    tasks.forEach(task => {
      categoryCount.set(task.category, (categoryCount.get(task.category) || 0) + 1);
      priorityCount.set(task.priority, (priorityCount.get(task.priority) || 0) + 1);
    });

    // 最も頻出するカテゴリと優先度の組み合わせを返す
    const mostCommonCategory = [...categoryCount.entries()]
      .sort((a, b) => b[1] - a[1])[0][0];
    const mostCommonPriority = [...priorityCount.entries()]
      .sort((a, b) => b[1] - a[1])[0][0];

    patterns.push({
      title: '定期的なタスク',
      description: '定期的に発生するタスクを追加',
      category: mostCommonCategory,
      priority: mostCommonPriority
    });

    return patterns;
  }
} 