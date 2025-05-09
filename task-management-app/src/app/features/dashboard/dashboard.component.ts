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

  // ステータス分布（円グラフ）
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

  // 優先度分布（棒グラフ）
  barPriorityData: ChartData<'bar', number[], string> = {
    labels: ['低', '中', '高'],
    datasets: [
      {
        label: '優先度',
        data: [0, 0, 0],
        backgroundColor: ['#66BB6A', '#FFA726', '#EF5350']
      }
    ]
  };
  barPriorityOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  // 担当者別タスク数（棒グラフ）
  barAssigneeData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [
      {
        label: '担当者',
        data: [],
        backgroundColor: '#42A5F5'
      }
    ]
  };
  barAssigneeOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  ngOnChanges() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.status === '完了').length;
    this.progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // ステータス分布
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

    // 優先度分布
    const low = this.tasks.filter(t => t.priority === '低').length;
    const medium = this.tasks.filter(t => t.priority === '中').length;
    const high = this.tasks.filter(t => t.priority === '高').length;
    this.barPriorityData = {
      labels: ['低', '中', '高'],
      datasets: [
        {
          label: '優先度',
          data: [low, medium, high],
          backgroundColor: ['#66BB6A', '#FFA726', '#EF5350']
        }
      ]
    };

    // 担当者別タスク数
    const assigneeMap: { [key: string]: number } = {};
    this.tasks.forEach(t => {
      const name = t.assignedTo || '未割り当て';
      assigneeMap[name] = (assigneeMap[name] || 0) + 1;
    });
    this.barAssigneeData = {
      labels: Object.keys(assigneeMap),
      datasets: [
        {
          label: '担当者',
          data: Object.values(assigneeMap),
          backgroundColor: '#42A5F5'
        }
      ]
    };
  }
}