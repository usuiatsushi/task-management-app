import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc, deleteDoc } from '@angular/fire/firestore';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import { Timestamp } from 'firebase/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class TaskDetailComponent implements OnInit {
  task: (Task & { dueDate: Date; createdAt: Date; updatedAt: Date }) | null = null;
  loading = true;
  deleting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore
  ) { }

  async ngOnInit() {
    const taskId = this.route.snapshot.paramMap.get('id');
    if (taskId) {
      await this.loadTask(taskId);
    }
    this.loading = false;
  }

  private async loadTask(taskId: string) {
    const taskRef = doc(this.firestore, 'tasks', taskId);
    const taskDoc = await getDoc(taskRef);
    
    if (taskDoc.exists()) {
      const data = taskDoc.data();
      const task = {
        id: taskDoc.id,
        ...data,
        dueDate: this.convertTimestampToDate(data['dueDate']),
        createdAt: this.convertTimestampToDate(data['createdAt']),
        updatedAt: this.convertTimestampToDate(data['updatedAt'])
      } as Task & { dueDate: Date; createdAt: Date; updatedAt: Date };
      
      // 日付が正しく変換されていることを確認
      if (!(task.dueDate instanceof Date)) {
        console.warn('Invalid dueDate for task:', task.id, task.dueDate);
      }
      
      this.task = task;
    }
  }

  private convertTimestampToDate(timestamp: any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
      return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    console.warn('Invalid timestamp format:', timestamp);
    return new Date();
  }

  async deleteTask() {
    if (!this.task?.id) return;
    
    this.deleting = true;
    try {
      const taskRef = doc(this.firestore, 'tasks', this.task.id);
      await deleteDoc(taskRef);
      this.router.navigate(['/tasks']);
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      this.deleting = false;
    }
  }
} 