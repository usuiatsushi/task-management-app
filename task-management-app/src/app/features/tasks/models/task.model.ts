import { Timestamp } from 'firebase/firestore';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: '未着手' | '進行中' | '完了';
  priority: '低' | '中' | '高';
  category: string;
  assignedTo: string;
  dueDate: {
    seconds: number;
    nanoseconds: number;
  };
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  updatedAt: {
    seconds: number;
    nanoseconds: number;
  };
  userId: string;
  calendarEventId?: string;
} 