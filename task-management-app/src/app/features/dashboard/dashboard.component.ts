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
        backgroundColor: ['#64b5f6', '#ffb74d', '#81c784'],
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 8
      }
    ]
  };
  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { size: 14 },
          color: '#333'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number | null) => a + (b || 0), 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value}件 (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
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

  categoryChartData: ChartData<'pie'> | ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }]
  };

  categoryChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const }
    }
  };

  // 完了率の推移（折れ線グラフ）
  completionRateData: ChartData<'line', number[], string> = {
    labels: [],
    datasets: [
      {
        label: '完了率',
        data: [],
        borderColor: '#66BB6A',
        backgroundColor: 'rgba(102,187,106,0.2)',
        tension: 0.3
      }
    ]
  };
  completionRateOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  // 今週の目標達成率（ゲージ）
  weeklyGoalData: ChartData<'doughnut', number[], string> = {
    labels: ['達成率', '残り'],
    datasets: [{
      data: [0, 100],
      backgroundColor: ['#66BB6A', '#E0E0E0'],
      circumference: 180,
      rotation: -90
    }]
  };
  weeklyGoalOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '80%',
    plugins: {
      legend: {
        display: false
      }
    }
  };

  // 優先度ごとの完了率（積み上げ棒グラフ）
  priorityCompletionData: ChartData<'bar', number[], string> = {
    labels: ['低', '中', '高'],
    datasets: [
      {
        label: '完了',
        data: [0, 0, 0],
        backgroundColor: '#66BB6A',
        stack: 'Stack 0'
      },
      {
        label: '未完了',
        data: [0, 0, 0],
        backgroundColor: '#EF5350',
        stack: 'Stack 0'
      }
    ]
  };
  priorityCompletionOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value}件`
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12
          },
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + (b || 0), 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value}件 (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
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
          backgroundColor: ['#64b5f6', '#ffb74d', '#81c784'],
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 8
        }
      ]
    };

    // 優先度分布
    const low = this.tasks.filter(t => t.importance === '低').length;
    const medium = this.tasks.filter(t => t.importance === '中').length;
    const high = this.tasks.filter(t => t.importance === '高').length;
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
    const taskTrendDates = Object.keys(dateMap).sort();
    this.lineTaskTrendData = {
      labels: taskTrendDates,
      datasets: [
        {
          label: '新規タスク',
          data: taskTrendDates.map(d => dateMap[d].created),
          borderColor: '#42A5F5',
          backgroundColor: 'rgba(66,165,245,0.2)',
          tension: 0.3
        },
        {
          label: '完了タスク',
          data: taskTrendDates.map(d => dateMap[d].completed),
          borderColor: '#66BB6A',
          backgroundColor: 'rgba(102,187,106,0.2)',
          tension: 0.3
        }
      ]
    };

    const categoryCounts = this.countByCategory(this.tasks);
    this.categoryChartData = {
      labels: Object.keys(categoryCounts),
      datasets: [{
        data: Object.values(categoryCounts),
        backgroundColor: [
          '#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#ec407a', '#ff7043', '#26a69a'
        ]
      }]
    };

    // 完了率の推移データ生成
    const completionRateMap: { [date: string]: number } = {};
    this.tasks.forEach(t => {
      const date = toDate(t.updatedAt);
      if (date) {
        const dateStr = date.toISOString().slice(0, 10);
        if (!completionRateMap[dateStr]) {
          const tasksOnDate = this.tasks.filter(task => {
            const taskDate = toDate(task.updatedAt);
            return taskDate && taskDate.toISOString().slice(0, 10) === dateStr;
          });
          const completedOnDate = tasksOnDate.filter(task => task.status === '完了').length;
          completionRateMap[dateStr] = tasksOnDate.length > 0 
            ? Math.round((completedOnDate / tasksOnDate.length) * 100) 
            : 0;
        }
      }
    });

    const completionRateDates = Object.keys(completionRateMap).sort();
    this.completionRateData = {
      labels: completionRateDates,
      datasets: [{
        label: '完了率',
        data: completionRateDates.map(d => completionRateMap[d]),
        borderColor: '#66BB6A',
        backgroundColor: 'rgba(102,187,106,0.2)',
        tension: 0.3
      }]
    };

    // 今週の目標達成率計算
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    const weeklyTasks = this.tasks.filter(t => {
      const taskDate = toDate(t.updatedAt);
      return taskDate && taskDate >= startOfWeek && taskDate <= endOfWeek;
    });
    
    const weeklyCompleted = weeklyTasks.filter(t => t.status === '完了').length;
    const weeklyGoalRate = weeklyTasks.length > 0 
      ? Math.round((weeklyCompleted / weeklyTasks.length) * 100) 
      : 0;

    this.weeklyGoalData = {
      labels: ['達成率', '残り'],
      datasets: [{
        data: [weeklyGoalRate, 100 - weeklyGoalRate],
        backgroundColor: ['#66BB6A', '#E0E0E0'],
        circumference: 180,
        rotation: -90
      }]
    };

    // 優先度ごとの完了率データ生成
    const importanceData = {
      '低': { completed: 0, incomplete: 0 },
      '中': { completed: 0, incomplete: 0 },
      '高': { completed: 0, incomplete: 0 }
    };

    this.tasks.forEach(task => {
      const status = task.status === '完了' ? 'completed' : 'incomplete';
      importanceData[task.importance][status]++;
    });

    this.priorityCompletionData = {
      labels: ['低', '中', '高'],
      datasets: [
        {
          label: '完了',
          data: [
            importanceData['低'].completed,
            importanceData['中'].completed,
            importanceData['高'].completed
          ],
          backgroundColor: '#66BB6A',
          stack: 'Stack 0'
        },
        {
          label: '未完了',
          data: [
            importanceData['低'].incomplete,
            importanceData['中'].incomplete,
            importanceData['高'].incomplete
          ],
          backgroundColor: '#EF5350',
          stack: 'Stack 0'
        }
      ]
    };

    // 既存のグラフオプションをカスタマイズ
    this.pieChartOptions = {
      ...this.pieChartOptions,
      plugins: {
        ...this.pieChartOptions.plugins,
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a: number, b: number | null) => a + (b || 0), 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value}件 (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    };

    this.barPriorityOptions = {
      ...this.barPriorityOptions,
      plugins: {
        ...this.barPriorityOptions.plugins,
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              return `${value}件`;
            }
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    };
  }

  private countByCategory(tasks: Task[]): { [category: string]: number } {
    const counts: { [category: string]: number } = {};
    for (const t of tasks) {
      const category = t.category || '未分類';
      counts[category] = (counts[category] || 0) + 1;
    }
    return counts;
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