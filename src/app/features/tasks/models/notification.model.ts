import { Timestamp } from 'firebase/firestore';

export interface Notification {
  id?: string;
  type: 'comment' | 'reply' | 'mention' | 'deadline';
  userId: string;
  taskId: string;
  commentId?: string;
  parentCommentId?: string;
  message: string;
  createdAt: Timestamp;
  isRead: boolean;
} 