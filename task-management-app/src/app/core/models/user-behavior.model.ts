export interface UserBehavior {
  timestamp: Date;
  eventType: string;
  targetElement?: string;
  targetId?: string;
  targetClass?: string;
  pageUrl: string;
  scrollPosition?: number;
} 