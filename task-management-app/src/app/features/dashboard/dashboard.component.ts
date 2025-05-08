import { Component, Input, OnChanges } from '@angular/core';
import { Task } from 'src/app/features/tasks/models/task.model';
import { GoogleChartsModule, ChartType } from 'angular-google-charts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [GoogleChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnChanges {
  @Input() tasks: Task[] = [];

  // 円グラフ用
  statusChartData: any[] = [];
  statusChartOptions = {
    title: 'ステータス別タスク数',
    pieHole: 0.4,
    legend: { position: 'bottom' }
  };

  // 進捗率
  progressPercent = 0;

  chartType = ChartType.PieChart;

  ngOnChanges() {
    const notStarted = this.tasks.filter(t => t.status === '未着手').length;
    const inProgress = this.tasks.filter(t => t.status === '進行中').length;
    const completed = this.tasks.filter(t => t.status === '完了').length;
    const total = this.tasks.length;

    this.statusChartData = [
      ['ステータス', '件数'],
      ['未着手', notStarted],
      ['進行中', inProgress],
      ['完了', completed]
    ];

    this.progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  }
}
