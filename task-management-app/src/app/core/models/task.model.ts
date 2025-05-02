import { Timestamp } from '@angular/fire/firestore';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: '高' | '中' | '低';
  dueDate: Date | Timestamp;
  status: '未着手' | '進行中' | '完了';
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  assignedTo?: string;
  tags?: string[];
  estimatedTime?: number;
  actualTime?: number;
  dependencies?: string[];
  notes?: string;
} 