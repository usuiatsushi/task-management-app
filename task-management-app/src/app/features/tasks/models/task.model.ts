import { Timestamp } from 'firebase/firestore';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: '未着手' | '進行中' | '完了';
  priority: '低' | '中' | '高';
  category: string;
  assignedTo: string;
  dueDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
  calendarEventId?: string;
  progress?: number;
} 