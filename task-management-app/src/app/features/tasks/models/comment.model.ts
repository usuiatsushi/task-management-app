import { Timestamp } from 'firebase/firestore';

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isEdited: boolean;
  editHistory?: { content: string; editedAt: Timestamp }[];
  parentId?: string | null;
} 