import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, orderBy } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Task } from '../models/task.model';

export interface TaskRelationship {
  id?: string;
  sourceTaskId: string;
  targetTaskId: string;
  relationshipType: 'dependency' | 'blocking' | 'related';
  strength: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TaskRelationshipService {
  private readonly COLLECTION_NAME = 'task_relationships';
  private relationshipsSubject = new BehaviorSubject<TaskRelationship[]>([]);
  relationships$ = this.relationshipsSubject.asObservable();

  constructor(private firestore: Firestore) {}

  async analyzeRelationships(taskId: string): Promise<TaskRelationship[]> {
    try {
      const task = await this.getTask(taskId);
      if (!task) return [];

      const allTasks = await this.getAllTasks();
      const relationships: TaskRelationship[] = [];

      for (const otherTask of allTasks) {
        if (otherTask.id === taskId) continue;

        const strength = this.calculateRelationshipStrength(task, otherTask);
        if (strength > 0.3) { // 閾値を設定
          relationships.push({
            sourceTaskId: taskId,
            targetTaskId: otherTask.id!,
            relationshipType: this.determineRelationshipType(task, otherTask),
            strength,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      await this.saveRelationships(relationships);
      return relationships;
    } catch (error) {
      console.error('タスク関連性の分析に失敗しました:', error);
      throw error;
    }
  }

  private async getTask(taskId: string): Promise<Task | null> {
    const tasksRef = collection(this.firestore, 'tasks');
    const q = query(tasksRef, where('id', '==', taskId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs[0]?.data() as Task || null;
  }

  private async getAllTasks(): Promise<Task[]> {
    const tasksRef = collection(this.firestore, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Task);
  }

  private calculateRelationshipStrength(task1: Task, task2: Task): number {
    let score = 0;
    let totalFactors = 0;

    // カテゴリの一致
    if (task1.category === task2.category) {
      score += 0.3;
    }
    totalFactors += 0.3;

    // タグの重複
    const commonTags = task1.tags?.filter(tag => task2.tags?.includes(tag)) || [];
    if (commonTags.length > 0) {
      score += (commonTags.length / Math.max(task1.tags?.length || 0, task2.tags?.length || 0)) * 0.2;
    }
    totalFactors += 0.2;

    // 期限の近さ
    if (task1.dueDate && task2.dueDate) {
      const dateDiff = Math.abs(task1.dueDate.toDate().getTime() - task2.dueDate.toDate().getTime());
      const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) {
        score += (1 - daysDiff / 7) * 0.2;
      }
    }
    totalFactors += 0.2;

    // 優先度の類似度
    if (task1.priority === task2.priority) {
      score += 0.3;
    }
    totalFactors += 0.3;

    return score / totalFactors;
  }

  private determineRelationshipType(task1: Task, task2: Task): TaskRelationship['relationshipType'] {
    // 依存関係の判定
    if (task1.dependencies?.includes(task2.id!) || task2.dependencies?.includes(task1.id!)) {
      return 'dependency';
    }

    // ブロッキング関係の判定
    if (task1.status === 'blocked' && task1.blockedBy === task2.id) {
      return 'blocking';
    }

    // その他の関連
    return 'related';
  }

  private async saveRelationships(relationships: TaskRelationship[]): Promise<void> {
    const relationshipsRef = collection(this.firestore, this.COLLECTION_NAME);
    
    for (const relationship of relationships) {
      await addDoc(relationshipsRef, relationship);
    }
  }

  async getRelationships(taskId: string): Promise<TaskRelationship[]> {
    try {
      const relationshipsRef = collection(this.firestore, this.COLLECTION_NAME);
      const q = query(
        relationshipsRef,
        where('sourceTaskId', '==', taskId),
        orderBy('strength', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate(),
        updatedAt: doc.data()['updatedAt']?.toDate()
      })) as TaskRelationship[];
    } catch (error) {
      console.error('関連性の取得に失敗しました:', error);
      throw error;
    }
  }
} 