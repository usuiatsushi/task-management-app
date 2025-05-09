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
  overdueCount = 0;

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

  // タスク推移（折れ線グラフ）
  lineTaskTrendData: ChartData<'line', number[], string> = {
    labels: [],
    datasets: [
      {
        label: '新規タスク',
        data: [],
        borderColor: '#42A5F5',
        backgroundColor: 'rgba(66,165,245,0.2)',
        tension: 0.3
      },
      {
        label: '完了タスク',
        data: [],
        borderColor: '#66BB6A',
        backgroundColor: 'rgba(102,187,106,0.2)',
        tension: 0.3
      }
    ]
  };
  lineTaskTrendOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const
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

    const now = new Date();
    this.overdueCount = this.tasks.filter(t => {
      const due = toDate(t.dueDate);
      return due && due < now && t.status !== '完了';
    }).length;

    // 折れ線グラフ用データ生成
    const dateMap: { [date: string]: { created: number; completed: number } } = {};
    this.tasks.forEach(t => {
      // 新規タスク（作成日）
      const createdAt = toDate(t.createdAt);
      if (createdAt) {
        const dateStr = createdAt.toISOString().slice(0, 10);
        if (!dateMap[dateStr]) dateMap[dateStr] = { created: 0, completed: 0 };
        dateMap[dateStr].created += 1;
      }
      // 完了タスク（完了日がupdatedAtで代用されている場合）
      if (t.status === '完了') {
        const completedAt = toDate(t.updatedAt);
        if (completedAt) {
          const dateStr = completedAt.toISOString().slice(0, 10);
          if (!dateMap[dateStr]) dateMap[dateStr] = { created: 0, completed: 0 };
          dateMap[dateStr].completed += 1;
        }
      }
    });
    // 日付順に並べる
    const sortedDates = Object.keys(dateMap).sort();
    this.lineTaskTrendData = {
      labels: sortedDates,
      datasets: [
        {
          label: '新規タスク',
          data: sortedDates.map(d => dateMap[d].created),
          borderColor: '#42A5F5',
          backgroundColor: 'rgba(66,165,245,0.2)',
          tension: 0.3
        },
        {
          label: '完了タスク',
          data: sortedDates.map(d => dateMap[d].completed),
          borderColor: '#66BB6A',
          backgroundColor: 'rgba(102,187,106,0.2)',
          tension: 0.3
        }
      ]
    };
  }
}

function toDate(d: any): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (typeof d === 'string' || typeof d === 'number') return new Date(d);
  if ('toDate' in d && typeof d.toDate === 'function') return d.toDate();
  if ('seconds' in d) return new Date(d.seconds * 1000);
  return null;
}