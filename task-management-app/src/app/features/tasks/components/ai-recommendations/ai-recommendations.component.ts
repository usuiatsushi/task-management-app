import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AISuggestion } from '../../models/ai-assistant.model';
import { Task } from '../../models/task.model';
import { Timestamp } from '@angular/fire/firestore';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-ai-recommendations',
  templateUrl: './ai-recommendations.component.html',
  styleUrls: ['./ai-recommendations.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class AiRecommendationsComponent implements OnInit {
  @Input() task: Task | null = null;
  @Input() suggestions: AISuggestion | null = null;

  private _activeTab = 0;
  get activeTab(): number {
    return this._activeTab;
  }
  set activeTab(value: number) {
    this._activeTab = value;
    this.cdr.markForCheck();
  }

  expandedSections: { [key: string]: boolean } = {};

  constructor(
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    // 初期表示時に優先度調整タブを展開
    this.expandedSections['priority'] = true;
  }

  toggleSection(section: string): void {
    this.expandedSections[section] = !this.expandedSections[section];
    this.cdr.markForCheck();
  }

  onTabChange(event: any): void {
    this.activeTab = event.index;
  }

  // キーボードナビゲーション用のメソッド
  onKeyDown(event: KeyboardEvent, element: HTMLElement): void {
    switch (event.key) {
      case 'ArrowRight':
        this.navigateNextTab();
        break;
      case 'ArrowLeft':
        this.navigatePreviousTab();
        break;
      case 'Home':
        this.navigateToFirstTab();
        break;
      case 'End':
        this.navigateToLastTab();
        break;
      case 'Enter':
      case ' ':
        element.click();
        break;
    }
  }

  private navigateNextTab(): void {
    if (this.activeTab < 4) {
      this.activeTab++;
    }
  }

  private navigatePreviousTab(): void {
    if (this.activeTab > 0) {
      this.activeTab--;
    }
  }

  private navigateToFirstTab(): void {
    this.activeTab = 0;
  }

  private navigateToLastTab(): void {
    this.activeTab = 4;
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