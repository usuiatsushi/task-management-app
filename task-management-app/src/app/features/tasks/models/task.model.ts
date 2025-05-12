import { Timestamp } from 'firebase/firestore';

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
  status: '未着手' | '進行中' | '完了';
  importance: '低' | '中' | '高';
  category: string;
  assignedTo: string;
  dueDate: Timestamp | { seconds: number; nanoseconds: number } | Date | string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
  calendarEventId?: string;
  progress?: number;
  subTasks?: SubTask[];
  completed: boolean;
  projectId?: string;
  startDate?: Timestamp | Date | string | null;
  duration?: number;
  urgent?: boolean;
  completedAt?: Timestamp | Date | string | null;
  assignee?: {
    id: string;
    name: string;
  };
   // 一括付与済み
} 