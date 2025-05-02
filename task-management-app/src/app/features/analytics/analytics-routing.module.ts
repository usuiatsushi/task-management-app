import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PerformanceDashboardComponent } from './components/performance-dashboard/performance-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: PerformanceDashboardComponent,
    data: {
      title: 'パフォーマンスダッシュボード',
      description: 'アプリケーションのパフォーマンスメトリクス、エラーログ、ユーザー行動を表示します'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnalyticsRoutingModule { } 