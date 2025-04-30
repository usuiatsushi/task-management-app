export interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  userName: string;
  role: 'owner' | 'member';
  joinedAt: Date;
} 