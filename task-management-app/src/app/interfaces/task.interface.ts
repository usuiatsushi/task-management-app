export interface Task {
  id?: string;
  title: string;
  description: string;
  dueDate?: string;
  status: 'pending' | 'completed';
  calendarEventId?: string;
  createdAt: Date;
  updatedAt: Date;
} 