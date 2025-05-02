export interface AISuggestion {
  // 基本情報
  category: string;
  priority: '高' | '中' | '低';
  suggestedDueDate: Date;
  relatedTasks: string[];
  confidence: number;
  lastUpdated: Date;

  // 推奨事項
  priorityAdjustments: string[];
  resourceAllocation: string[];
  timelineOptimization: string[];
  taskManagement: string[];
  collaboration: string[];
  actionPlan: string[];
}

export interface UserPreferences {
  preferredWorkHours: {
    start: string;
    end: string;
  };
  priorityWeights: {
    high: number;
    medium: number;
    low: number;
  };
  categoryPreferences: {
    [key: string]: number;
  };
  collaborationPreferences: {
    teamSize: number;
    preferredTools: string[];
  };
}

export interface TaskAnalysis {
  complexity: number;
  estimatedTime: number;
  requiredSkills: string[];
  dependencies: string[];
  riskFactors: string[];
  optimizationOpportunities: string[];
} 