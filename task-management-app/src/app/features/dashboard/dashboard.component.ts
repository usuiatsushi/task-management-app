import { Component, Input, OnChanges } from '@angular/core';
import { Task } from 'src/app/features/tasks/models/task.model';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgChartsModule, MatIconModule],
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
        backgroundColor: [
          '#64b5f6', // グラデーション風（明るい青）
          '#ffb74d', // グラデーション風（明るいオレンジ）
          '#81c784'  // グラデーション風（明るい緑）
        ],
        borderColor: 'rgba(0,0,0,0)',
        borderWidth: 4,
        hoverOffset: 12
      }
    ]
  };
  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 11, weight: 'bold' },
          color: '#222',
          usePointStyle: true,
          padding: 16
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
      duration: 1400,
      easing: 'easeOutElastic'
    }
  };

  // 重要度分布（棒グラフ）
  barPriorityData: ChartData<'bar', number[], string> = {
    labels: ['低', '中', '高'],
    datasets: [
      {
        label: '重要度',
        data: [0, 0, 0],
        backgroundColor: ['#64b5f6', '#ffb74d', '#ef5350'],
        barPercentage: 0.7,
        categoryPercentage: 0.6
      }
    ]
  };
  barPriorityOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            const total = Number((context.dataset.data as (number | null)[]).reduce((a, b) => (typeof a === 'number' ? a : 0) + (typeof b === 'number' ? b : 0), 0));
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${value}件 (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 15, weight: 'bold' }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.06)'
        },
        ticks: {
          font: { size: 15, weight: 'bold' }
        }
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    }
  };

  // 担当者別タスク数（棒グラフ）
  barAssigneeData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [
      {
        label: '担当者',
        data: [],
        backgroundColor: [
          '#64b5f6', '#ffb74d', '#81c784', '#ba68c8', '#ffd54f', '#4dd0e1', '#e57373'
        ], // 担当者ごとに色分け
        barPercentage: 0.7,
        categoryPercentage: 0.6
      }
    ]
  };
  barAssigneeOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            const total = Number((context.dataset.data as (number | null)[]).reduce((a, b) => (typeof a === 'number' ? a : 0) + (typeof b === 'number' ? b : 0), 0));
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${value}件 (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 15, weight: 'bold' }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.06)'
        },
        ticks: {
          font: { size: 15, weight: 'bold' }
        }
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    }
  };

  // タスク推移（折れ線グラフ）
  lineTaskTrendData: ChartData<'line', number[], string> = {
    labels: [],
    datasets: [
      {
        label: '新規タスク',
        data: [],
        borderColor: '#64b5f6',
        backgroundColor: 'rgba(100,181,246,0.15)',
        tension: 0,
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: '#64b5f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: '完了タスク',
        data: [],
        borderColor: '#81c784',
        backgroundColor: 'rgba(129,199,132,0.15)',
        tension: 0,
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: '#81c784',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };
  lineTaskTrendOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 14, weight: 'bold' },
          color: '#222',
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          title: (items) => items[0]?.label || '',
          label: (context) => `${context.dataset.label}: ${context.parsed.y}件`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 13, weight: 'bold' }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.06)'
        },
        ticks: {
          font: { size: 13, weight: 'bold' }
        }
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    }
  };

  categoryChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#64b5f6', '#ffb74d', '#81c784', '#ba68c8', '#ffd54f', '#4dd0e1', '#e57373'
      ],
      borderColor: 'rgba(0,0,0,0)',
      borderWidth: 3,
      hoverOffset: 10
    }]
  };

  categoryChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 11, weight: 'bold' },
          color: '#222',
          usePointStyle: true,
          padding: 16
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
      duration: 1200,
      easing: 'easeOutElastic'
    }
  };

  // 完了率の推移（折れ線グラフ）
  completionRateData: ChartData<'line', number[], string> = {
    labels: [],
    datasets: [{
      label: '完了率',
      data: [],
      borderColor: '#81c784',
      backgroundColor: 'rgba(129,199,132,0.15)',
      tension: 0,
      borderWidth: 3,
      pointRadius: 5,
      pointBackgroundColor: '#81c784',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };
  completionRateOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0,0,0,0.06)'
        },
        ticks: {
          callback: (value) => `${value}%`,
          font: { size: 13, weight: 'bold' }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 13, weight: 'bold' }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: (items) => items[0]?.label || '',
          label: (context) => `完了率: ${context.parsed.y}%`
        }
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
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

  // 重要度ごとの完了率（積み上げ棒グラフ）
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
          backgroundColor: [
            '#64b5f6',
            '#ffb74d',
            '#81c784'
          ],
          borderColor: 'rgba(0,0,0,0)',
          borderWidth: 4,
          hoverOffset: 12
        }
      ]
    };

    // 重要度分布
    const low = this.tasks.filter(t => t.importance === '低').length;
    const medium = this.tasks.filter(t => t.importance === '中').length;
    const high = this.tasks.filter(t => t.importance === '高').length;
    this.barPriorityData = {
      labels: ['低', '中', '高'],
      datasets: [
        {
          label: '重要度',
          data: [low, medium, high],
          backgroundColor: ['#64b5f6', '#ffb74d', '#ef5350'],
          barPercentage: 0.7,
          categoryPercentage: 0.6
        }
      ]
    };

    // 担当者別タスク数
    const assigneeMap: { [key: string]: number } = {};
    this.tasks.forEach(t => {
      const name = t.assignedTo || '未割り当て';
      assigneeMap[name] = (assigneeMap[name] || 0) + 1;
    });
    const assigneeColors = ['#64b5f6', '#ffb74d', '#81c784', '#ba68c8', '#ffd54f', '#4dd0e1', '#e57373'];
    this.barAssigneeData = {
      labels: Object.keys(assigneeMap),
      datasets: [
        {
          label: '担当者',
          data: Object.values(assigneeMap),
          backgroundColor: Object.keys(assigneeMap).map((_, i) => assigneeColors[i % assigneeColors.length]),
          barPercentage: 0.7,
          categoryPercentage: 0.6
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
          borderColor: '#64b5f6',
          backgroundColor: 'rgba(100,181,246,0.15)',
          tension: 0,
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: '#64b5f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: '完了タスク',
          data: taskTrendDates.map(d => dateMap[d].completed),
          borderColor: '#81c784',
          backgroundColor: 'rgba(129,199,132,0.15)',
          tension: 0,
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: '#81c784',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    };

    const categoryCounts = this.countByCategory(this.tasks);
    this.categoryChartData = {
      labels: Object.keys(categoryCounts),
      datasets: [{
        data: Object.values(categoryCounts),
        backgroundColor: Object.keys(categoryCounts).map((_, i) => [
          '#64b5f6', '#ffb74d', '#81c784', '#ba68c8', '#ffd54f', '#4dd0e1', '#e57373'
        ][i % 7]),
        borderColor: 'rgba(0,0,0,0)',
        borderWidth: 3,
        hoverOffset: 10
      }]
    };

    // 完了率の推移データ生成（累積完了率）
    // すべてのタスクのcreatedAt・updatedAtから日付リストを作成
    const allDatesSet = new Set<string>();
    this.tasks.forEach(t => {
      const created = toDate(t.createdAt);
      const updated = toDate(t.updatedAt);
      if (created) allDatesSet.add(created.toISOString().slice(0, 10));
      if (updated) allDatesSet.add(updated.toISOString().slice(0, 10));
    });
    const allDates = Array.from(allDatesSet).sort();
    const completionRateMap: { [date: string]: number } = {};
    allDates.forEach(dateStr => {
      const dateObj = new Date(dateStr);
      const tasksUntilDate = this.tasks.filter(t => {
        const created = toDate(t.createdAt);
        return created && created <= dateObj;
      });
      const completedUntilDate = tasksUntilDate.filter(t => {
        const completed = toDate(t.completedAt) || toDate(t.updatedAt) || toDate(t.createdAt);
        return t.status === '完了' && completed && completed <= dateObj;
      }).length;
      completionRateMap[dateStr] = tasksUntilDate.length > 0
        ? Math.round((completedUntilDate / tasksUntilDate.length) * 100)
        : 0;
    });
    const completionRateDates = Object.keys(completionRateMap).sort();
    this.completionRateData = {
      labels: completionRateDates,
      datasets: [{
        label: '完了率',
        data: completionRateDates.map(d => completionRateMap[d]),
        borderColor: '#81c784',
        backgroundColor: 'rgba(129,199,132,0.15)',
        tension: 0,
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: '#81c784',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
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

    // 重要度ごとの完了率データ生成
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