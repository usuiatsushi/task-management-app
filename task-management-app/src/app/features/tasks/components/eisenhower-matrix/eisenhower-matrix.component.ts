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

  // 重要度: 高＝priority: '高'、緊急度: urgent
  get quadrant1() {
    return this.tasks.filter(t => t.priority === '高' && t.urgent);
  }
  get quadrant2() {
    return this.tasks.filter(t => t.priority === '高' && !t.urgent);
  }
  get quadrant3() {
    return this.tasks.filter(t => t.priority !== '高' && t.urgent);
  }
  get quadrant4() {
    return this.tasks.filter(t => t.priority !== '高' && !t.urgent);
  }
} 