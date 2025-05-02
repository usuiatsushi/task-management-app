export interface PerformanceMetrics {
  timestamp: Date;
  pageLoadTime: number;
  domContentLoadedTime: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
  memoryUsage: number;
  networkRequests: number;
  componentRenderTime: number;
} 