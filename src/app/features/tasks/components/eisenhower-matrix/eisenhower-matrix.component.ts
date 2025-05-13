import { Component, Input } from '@angular/core';
import { Task } from '../../models/task.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-eisenhower-matrix',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eisenhower-matrix.component.html',
  styleUrls: ['./eisenhower-matrix.component.css']
})
export class EisenhowerMatrixComponent {
  @Input() tasks: Task[] = [];

  // 完了タスクを除外したタスクリストを取得
  private get incompleteTasks(): Task[] {
    return this.tasks.filter(task => task.status !== '完了');
  }

  // 重要度: 高＝importance: '高'、緊急度: urgent
  get quadrant1() {
    return this.incompleteTasks.filter(t => t.importance === '高' && t.urgent);
  }
  get quadrant2() {
    return this.incompleteTasks.filter(t => t.importance === '高' && !t.urgent);
  }
  get quadrant3() {
    return this.incompleteTasks.filter(t => t.importance !== '高' && t.urgent);
  }
  get quadrant4() {
    return this.incompleteTasks.filter(t => t.importance !== '高' && !t.urgent);
  }

  // Firestore Timestampやオブジェクト型にも対応した日付変換
  public toDate(d: any): Date | null {
    if (!d) return null;
    if (d instanceof Date) return d;
    if (typeof d === 'string' || typeof d === 'number') return new Date(d);
    if ('toDate' in d && typeof d.toDate === 'function') return d.toDate();
    if ('seconds' in d) return new Date(d.seconds * 1000);
    return null;
  }
} 