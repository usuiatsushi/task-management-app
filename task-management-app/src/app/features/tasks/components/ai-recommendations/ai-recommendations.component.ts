import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AISuggestion } from '../../models/ai-assistant.model';
import { Task } from '../../models/task.model';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-ai-recommendations',
  templateUrl: './ai-recommendations.component.html',
  styleUrls: ['./ai-recommendations.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiRecommendationsComponent implements OnInit {
  @Input() set task(value: Task | null) {
    this._task = value;
    this.cdr.markForCheck();
  }
  get task(): Task | null {
    return this._task;
  }
  private _task: Task | null = null;

  @Input() set suggestions(value: AISuggestion | null) {
    this._suggestions = value;
    this.cdr.markForCheck();
  }
  get suggestions(): AISuggestion | null {
    return this._suggestions;
  }
  private _suggestions: AISuggestion | null = null;

  activeTab: 'priority' | 'resource' | 'timeline' | 'management' | 'collaboration' = 'priority';
  expandedSections: { [key: string]: boolean } = {};

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // 初期表示時に優先度調整タブを展開
    this.expandedSections['priority'] = true;
  }

  toggleSection(section: string): void {
    this.expandedSections[section] = !this.expandedSections[section];
    this.cdr.markForCheck();
  }

  // メモ化されたヘルパーメソッド
  private priorityIconCache = new Map<string, string>();
  getPriorityIcon(priority: string | null | undefined): string {
    if (!priority) return 'priority_medium';
    
    const cached = this.priorityIconCache.get(priority);
    if (cached) return cached;

    const icon = this.calculatePriorityIcon(priority);
    this.priorityIconCache.set(priority, icon);
    return icon;
  }

  private calculatePriorityIcon(priority: string): string {
    switch (priority) {
      case '高':
        return 'priority_high';
      case '中':
        return 'priority_medium';
      case '低':
        return 'priority_low';
      default:
        return 'priority_medium';
    }
  }

  private categoryIconCache = new Map<string, string>();
  getCategoryIcon(category: string | null | undefined): string {
    if (!category) return 'category';
    
    const cached = this.categoryIconCache.get(category);
    if (cached) return cached;

    const icon = this.calculateCategoryIcon(category);
    this.categoryIconCache.set(category, icon);
    return icon;
  }

  private calculateCategoryIcon(category: string): string {
    switch (category) {
      case '仕事':
        return 'work';
      case '学習':
        return 'school';
      case '健康':
        return 'fitness_center';
      case 'プライベート':
        return 'person';
      default:
        return 'category';
    }
  }

  private dateFormatCache = new Map<string, string>();
  formatDate(date: Date | Timestamp | null | undefined): string {
    if (!date) return '';
    
    const cacheKey = date instanceof Timestamp 
      ? date.toDate().toISOString()
      : date instanceof Date 
        ? date.toISOString()
        : '';
    
    if (!cacheKey) return '';
    
    const cached = this.dateFormatCache.get(cacheKey);
    if (cached) return cached;

    const formatted = this.calculateFormattedDate(date);
    this.dateFormatCache.set(cacheKey, formatted);
    return formatted;
  }

  private calculateFormattedDate(date: Date | Timestamp): string {
    const dateObj = date instanceof Timestamp ? date.toDate() : date;
    return dateObj.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTaskTitle(): string {
    return this.task?.title || '';
  }

  getTaskCategory(): string {
    return this.task?.category || '';
  }

  getTaskPriority(): string {
    return this.task?.priority || '';
  }

  getTaskDueDate(): Date | Timestamp | null {
    return this.task?.dueDate || null;
  }
} 