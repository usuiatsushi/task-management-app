export interface AISuggestion {
  // 基本情報
  category: string;
  priority: '低' | '中' | '高';
  suggestedDueDate: Date | null;
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

  // 分析情報
  eisenhowerMatrix: {
    urgent: boolean;
    important: boolean;
    quadrant: '重要かつ緊急' | '重要だが緊急でない' | '緊急だが重要でない' | '重要でも緊急でもない';
  };
  analysis: {
    historicalData: any;
    currentStatus: any;
  };
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