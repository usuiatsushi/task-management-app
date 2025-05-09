import { Component, Input, OnChanges } from '@angular/core';
import { Task } from 'src/app/features/tasks/models/task.model';
import { GoogleChartsModule, ChartType } from 'angular-google-charts';

type GoogleChartInterface = {
  chartType: ChartType;
  dataTable: any[][];
  options: any;
};

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

  priorityChart: GoogleChartInterface = {
    chartType: ChartType.ColumnChart,
    dataTable: [
      ['優先度', '件数'],
      ['低', 0],
      ['中', 0],
      ['高', 0]
    ],
    options: {
      title: '優先度分布',
      colors: ['#66BB6A', '#FFA726', '#EF5350']
    }
  };

  assigneeChart: GoogleChartInterface = {
    chartType: ChartType.BarChart,
    dataTable: [
      ['担当者', 'タスク数']
    ],
    options: {
      title: '担当者別タスク数',
      legend: { position: 'none' }
    }
  };

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

    // 優先度分布の更新（日本語ラベルで統一）
    const priorityCounts = this.countByProperty('priority');
    this.priorityChart.dataTable = [
      ['優先度', '件数'],
      ['低', Number(priorityCounts['低'] || 0)],
      ['中', Number(priorityCounts['中'] || 0)],
      ['高', Number(priorityCounts['高'] || 0)]
    ];
    console.log(this.priorityChart.dataTable);

    // 担当者別タスク数の更新
    const assigneeCounts = this.countByProperty('assignedTo');
    this.assigneeChart.dataTable = [
      ['担当者', 'タスク数'],
      ...Object.entries(assigneeCounts).map(([assignee, count]) => [assignee || '未割り当て', Number(count)])
    ];
  }

  countByProperty(property: string): Record<string, number> {
    return this.tasks.reduce((counts, task) => {
      let value = task[property as keyof Task];
      if (typeof value !== 'string') return counts;
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
      return counts;
    }, {} as Record<string, number>);
  }
}
