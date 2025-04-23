export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: '未着手' | '進行中' | '完了';
  priority: '低' | '中' | '高';
  dueDate: Date;
  assignedTo: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
} 