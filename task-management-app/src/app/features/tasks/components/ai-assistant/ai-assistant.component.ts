import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { Task } from '../../models/task.model';
import { AISuggestion, EisenhowerMatrix, TaskAnalysis } from '../../models/ai-assistant.model';

@Component({
  selector: 'app-ai-assistant',
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  providers: [AiAssistantService]
})
export class AIAssistantComponent implements OnInit {
  loading = false;
  suggestions: AISuggestion | null = null;
  matrix: EisenhowerMatrix | null = null;
  analysis: TaskAnalysis | null = null;
  currentTask: Task | null = null;

  constructor(private aiService: AiAssistantService) {}

  ngOnInit(): void {
    // 初期化処理
  }

  async analyzeTask(task: Task): Promise<void> {
    this.loading = true;
    try {
      this.currentTask = task;
      this.suggestions = await this.aiService.analyzeTask(task);
      this.matrix = await this.aiService.analyzeTaskMatrix(task);
      this.analysis = await this.aiService.analyzeTaskHistory(task.userId);
    } catch (error) {
      console.error('タスク分析に失敗しました:', error);
    } finally {
      this.loading = false;
    }
  }

  getQuadrantClass(quadrant: string): string {
    return `quadrant-${quadrant.replace(/\s+/g, '-').toLowerCase()}`;
  }
} 