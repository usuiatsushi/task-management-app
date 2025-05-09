export interface AISuggestion {
  category: string;
  importance: '低' | '中' | '高';
  suggestedDueDate: Date;
  relatedTasks: string[];
  actionPlan: string[];
}

export interface EisenhowerMatrix {
  urgent: boolean;
  important: boolean;
  quadrant: '重要かつ緊急' | '重要だが緊急でない' | '緊急だが重要でない' | '重要でも緊急でもない';
}

export interface TaskAnalysis {
  historicalData: {
    averageCompletionTime: number;
    commonCategories: string[];
    frequentCollaborators: string[];
  };
  currentStatus: {
    workload: number;
    overdueTasks: number;
    upcomingDeadlines: number;
  };
  recommendations: {
    priorityAdjustments: string[];
    resourceAllocation: string[];
    timelineOptimization: string[];
  };
} 