import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { TaskRelationshipService, TaskRelationship } from '../../services/task-relationship.service';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-relationship',
  templateUrl: './task-relationship.component.html',
  styleUrls: ['./task-relationship.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    RouterModule
  ]
})
export class TaskRelationshipComponent implements OnInit {
  @Input() taskId!: string;
  relationships: TaskRelationship[] = [];
  relatedTasks: { [key: string]: Task } = {};
  loading = false;

  constructor(
    private relationshipService: TaskRelationshipService,
    private taskService: TaskService
  ) {}

  async ngOnInit() {
    await this.loadRelationships();
  }

  private async loadRelationships() {
    this.loading = true;
    try {
      this.relationships = await this.relationshipService.getRelationships(this.taskId);
      await this.loadRelatedTasks();
    } catch (error) {
      console.error('関連性の読み込みに失敗しました:', error);
    } finally {
      this.loading = false;
    }
  }

  private async loadRelatedTasks() {
    for (const relationship of this.relationships) {
      const task = await this.taskService.getTask(relationship.targetTaskId);
      if (task) {
        this.relatedTasks[relationship.targetTaskId] = task;
      }
    }
  }

  getRelationshipIcon(type: TaskRelationship['relationshipType']): string {
    switch (type) {
      case 'dependency':
        return 'link';
      case 'blocking':
        return 'block';
      case 'related':
        return 'compare_arrows';
      default:
        return 'help';
    }
  }

  getRelationshipColor(type: TaskRelationship['relationshipType']): string {
    switch (type) {
      case 'dependency':
        return 'primary';
      case 'blocking':
        return 'warn';
      case 'related':
        return 'accent';
      default:
        return '';
    }
  }

  getRelationshipLabel(type: TaskRelationship['relationshipType']): string {
    switch (type) {
      case 'dependency':
        return '依存関係';
      case 'blocking':
        return 'ブロッキング';
      case 'related':
        return '関連タスク';
      default:
        return '不明';
    }
  }
} 