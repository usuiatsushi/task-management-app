import { Component, Input, OnInit } from '@angular/core';
import { AISuggestion } from '../../models/ai-assistant.model';
import { Task } from '../../models/task.model';

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

  getPriorityIcon(priority: string): string {
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

  getCategoryIcon(category: string): string {
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

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
} 