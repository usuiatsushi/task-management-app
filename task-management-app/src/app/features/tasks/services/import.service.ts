import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, Timestamp } from '@angular/fire/firestore';
import { Task } from '../models/task.model';
import { CategoryService } from './category.service';
import { CalendarService } from './calendar.service';
import { NgZone } from '@angular/core';

export enum ImportFileType {
  ASANA = 'asana',
  TRELLO = 'trello',
  SAMPLE = 'sample',
  OTHER = 'other'
}

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  constructor(
    private firestore: Firestore,
    private categoryService: CategoryService,
    private calendarService: CalendarService,
    private ngZone: NgZone
  ) {}

  private detectFileType(fileContent: string): ImportFileType {
    try {
      const data = JSON.parse(fileContent);

      // Asanaのファイル判定
      if (data.data && Array.isArray(data.data) && data.data[0]?.assignee) {
        return ImportFileType.ASANA;
      }

      // Trelloのファイル判定
      if (Array.isArray(data) && data[0]?.idBoard) {
        return ImportFileType.TRELLO;
      }

      // サンプルファイル判定
      if (Array.isArray(data) && data[0]?.isSample) {
        return ImportFileType.SAMPLE;
      }

      return ImportFileType.OTHER;
    } catch (error) {
      return ImportFileType.OTHER;
    }
  }

  private async importAsanaFile(fileContent: string): Promise<void> {
    const data = JSON.parse(fileContent);
    const tasks = data.data.map((task: any) => ({
      title: task.name,
      description: task.notes || '',
      dueDate: task.due_on ? new Date(task.due_on) : null,
      priority: this.mapAsanaPriority(task.priority),
      status: this.mapAsanaStatus(task.status),
      category: task.projects?.[0]?.name || '未分類',
      assignee: task.assignee?.name || '未割り当て'
    }));

    await this.saveTasks(tasks);
  }

  private async importTrelloFile(fileContent: string): Promise<void> {
    const data = JSON.parse(fileContent);
    const tasks = data.map((card: any) => ({
      title: card.name,
      description: card.desc || '',
      dueDate: card.due ? new Date(card.due) : null,
      priority: this.mapTrelloLabelsToPriority(card.labels),
      status: this.mapTrelloListToStatus(card.idList),
      category: card.idBoard || '未分類',
      assignee: card.idMembers?.[0] || '未割り当て'
    }));

    await this.saveTasks(tasks);
  }

  private async importSampleFile(fileContent: string): Promise<void> {
    const data = JSON.parse(fileContent);
    const tasks = data.map((task: any) => ({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      category: task.category || '未分類',
      assignee: task.assignee || '未割り当て'
    }));

    await this.saveTasks(tasks);
  }

  private async importOtherFile(fileContent: string): Promise<void> {
    try {
      const data = JSON.parse(fileContent);
      if (!Array.isArray(data)) {
        throw new Error('Invalid file format');
      }

      const tasks = data.map((item: any) => ({
        title: item.title || item.name || 'Untitled Task',
        description: item.description || item.notes || '',
        dueDate: item.dueDate ? new Date(item.dueDate) : null,
        priority: this.normalizePriority(item.priority),
        status: this.normalizeStatus(item.status),
        category: item.category || '未分類',
        assignee: item.assignee || '未割り当て'
      }));

      await this.saveTasks(tasks);
    } catch (error) {
      throw new Error('Failed to parse file: Invalid JSON format');
    }
  }

  private async saveTasks(tasks: any[]): Promise<void> {
    const tasksCollection = collection(this.firestore, 'tasks');
    
    for (const task of tasks) {
      const taskData: Task = {
        ...task,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: 'current-user-id' // 実際のユーザーIDに置き換える
      };

      await addDoc(tasksCollection, taskData);
      
      // カテゴリの保存
      if (task.category) {
        await this.categoryService.addCategory(task.category);
      }
    }
  }

  private mapAsanaPriority(priority: string): string {
    switch (priority) {
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private mapAsanaStatus(status: string): string {
    switch (status) {
      case 'completed': return 'completed';
      case 'in_progress': return 'in_progress';
      default: return 'pending';
    }
  }

  private mapTrelloLabelsToPriority(labels: any[]): string {
    const priorityLabels = labels?.filter(label => 
      ['high', 'medium', 'low'].includes(label.name.toLowerCase())
    );
    return priorityLabels?.[0]?.name.toLowerCase() || 'medium';
  }

  private mapTrelloListToStatus(idList: string): string {
    // TrelloのリストIDに基づいてステータスをマッピング
    return 'pending'; // 実際のマッピングロジックを実装
  }

  private normalizePriority(priority: string): string {
    const normalized = priority?.toLowerCase();
    return ['high', 'medium', 'low'].includes(normalized) ? normalized : 'medium';
  }

  private normalizeStatus(status: string): string {
    const normalized = status?.toLowerCase();
    return ['completed', 'in_progress', 'pending'].includes(normalized) ? normalized : 'pending';
  }

  async importTasks(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const fileContent = event.target?.result as string;
          const fileType = this.detectFileType(fileContent);

          switch (fileType) {
            case ImportFileType.ASANA:
              await this.importAsanaFile(fileContent);
              break;
            case ImportFileType.TRELLO:
              await this.importTrelloFile(fileContent);
              break;
            case ImportFileType.SAMPLE:
              await this.importSampleFile(fileContent);
              break;
            case ImportFileType.OTHER:
              await this.importOtherFile(fileContent);
              break;
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }
} 