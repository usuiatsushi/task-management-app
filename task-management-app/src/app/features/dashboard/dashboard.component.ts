import { Component, Input, OnChanges } from '@angular/core';
import { Task } from 'src/app/features/tasks/models/task.model';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnChanges {
  @Input() tasks: Task[] = [];

  progressPercent = 0;

  pieChartData: ChartData<'pie', number[], string> = {
    labels: ['未着手', '進行中', '完了'],
    datasets: [
      {
        data: [1, 2, 3],
        backgroundColor: ['#42A5F5', '#FFA726', '#66BB6A']
      }
    ]
  };

  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };

  ngOnChanges() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.status === '完了').length;
    this.progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    this.pieChartData = {
      labels: ['未着手', '進行中', '完了'],
      datasets: [
        {
          data: [
            this.tasks.filter(t => t.status === '未着手').length,
            this.tasks.filter(t => t.status === '進行中').length,
            this.tasks.filter(t => t.status === '完了').length
          ],
          backgroundColor: ['#42A5F5', '#FFA726', '#66BB6A']
        }
      ]
    };
  }
}