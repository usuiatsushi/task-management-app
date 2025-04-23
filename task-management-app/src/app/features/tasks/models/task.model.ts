export interface Task {
  id?: string;
  title: string;
  description: string;
  category: string;
  status: '未対応' | '対応中' | '完了';
  priority: '高' | '中' | '低';
  dueDate: Date;
  assignedTo: string;
  createdAt: Date;
  updatedAt: Date;
} 