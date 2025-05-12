import { Timestamp } from 'firebase/firestore';

export interface Stakeholder {
  id: string;
  name: string;
  role: 'owner' | 'contributor' | 'reviewer' | 'observer';
  department: string;
  email: string;
  phone?: string;
  influence: 'high' | 'medium' | 'low';
  interest: 'high' | 'medium' | 'low';
  responsibility: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StakeholderGroup {
  id: string;
  name: string;
  description: string;
  stakeholders: Stakeholder[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StakeholderMatrix {
  id: string;
  taskId: string;
  stakeholders: {
    stakeholderId: string;
    role: 'owner' | 'contributor' | 'reviewer' | 'observer';
    responsibility: string;
    status: 'active' | 'inactive';
  }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
} 