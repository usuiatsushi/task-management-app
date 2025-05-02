import { Timestamp } from '@angular/fire/firestore';

export interface SubTask {
  id: string;
  title: string;
  assignee: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: '未着手' | '進行中' | '完了' | 'blocked';
  priority: '低' | '中' | '高';
  category: string;
  assignedTo: string;
  dueDate: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
  calendarEventId?: string;
  progress?: number;
  subTasks?: SubTask[];
  completed: boolean;
  tags?: string[];
  dependencies?: string[];
  blockedBy?: string;
} 