export interface ErrorLog {
  timestamp: Date;
  message: string;
  source?: string;
  lineNumber?: number;
  columnNumber?: number;
  error?: string;
  severity: 'error' | 'warning' | 'info';
} 