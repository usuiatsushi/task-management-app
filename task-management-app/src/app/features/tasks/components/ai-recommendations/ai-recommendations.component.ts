import { Component, Input, OnInit } from '@angular/core';
import { AISuggestion } from '../../models/ai-assistant.model';
import { Task } from '../../models/task.model';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-ai-recommendations',
  templateUrl: './ai-recommendations.component.html',
  styleUrls: ['./ai-recommendations.component.scss']
})
export class AiRecommendationsComponent implements OnInit {
  @Input() task: Task | null = null;
  @Input() suggestions: AISuggestion | null = null;

  activeTab: 'priority' | 'resource' | 'timeline' | 'management' | 'collaboration' = 'priority';
  expandedSections: { [key: string]: boolean } = {};

  ngOnInit(): void {
    // 初期表示時に優先度調整タブを展開
    this.expandedSections['priority'] = true;
  }

  toggleSection(section: string): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  getPriorityIcon(priority: string | null | undefined): string {
    if (!priority) return 'priority_medium';
    
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

  getCategoryIcon(category: string | null | undefined): string {
    if (!category) return 'category';
    
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

  formatDate(date: Date | Timestamp | null | undefined): string {
    if (!date) return '';
    
    let dateObj: Date;
    if (date instanceof Timestamp) {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return '';
    }
    
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