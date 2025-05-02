export class AIAssistantError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'AIAssistantError';
  }
}

export class TaskAnalysisError extends AIAssistantError {
  constructor(message: string, details?: any) {
    super(message, 'TASK_ANALYSIS_ERROR', details);
    this.name = 'TaskAnalysisError';
  }
}

export class TaskCategoryError extends AIAssistantError {
  constructor(message: string, details?: any) {
    super(message, 'TASK_CATEGORY_ERROR', details);
    this.name = 'TaskCategoryError';
  }
}

export class TaskPriorityError extends AIAssistantError {
  constructor(message: string, details?: any) {
    super(message, 'TASK_PRIORITY_ERROR', details);
    this.name = 'TaskPriorityError';
  }
}

export class FirestoreError extends AIAssistantError {
  constructor(message: string, details?: any) {
    super(message, 'FIRESTORE_ERROR', details);
    this.name = 'FirestoreError';
  }
}

export class ValidationError extends AIAssistantError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
} 