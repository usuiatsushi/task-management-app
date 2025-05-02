export interface AISuggestion {
  priorityAdjustments: string[];
  resourceAllocation: string[];
  timelineOptimization: string[];
  taskManagement: string[];
  collaboration: string[];
  actionPlan: string[];
  confidence: number;
  lastUpdated: Date;
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