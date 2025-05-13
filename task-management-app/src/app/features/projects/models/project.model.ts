import { Timestamp } from 'firebase/firestore';

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
  tasks: string[]; // タスクIDの配列
  members: string[]; // チームメンバーのユーザーID配列
} 