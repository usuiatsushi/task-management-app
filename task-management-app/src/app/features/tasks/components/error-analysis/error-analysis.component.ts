import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ErrorAnalysisService, ErrorAnalysis } from '../../services/error-analysis.service';

@Component({
  selector: 'app-error-analysis',
  templateUrl: './error-analysis.component.html',
  styleUrls: ['./error-analysis.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    BaseChartDirective
  ]
})
export class ErrorAnalysisComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  loading = false;
  error: string | null = null;
  errorAnalysis: ErrorAnalysis | null = null;

  // エラー発生率の時系列グラフ
  errorTrendChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [],
        label: 'エラー発生数',
        backgroundColor: 'rgba(255,0,0,0.2)',
        borderColor: 'rgba(255,0,0,1)',
        pointBackgroundColor: 'rgba(255,0,0,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255,0,0,0.8)',
        fill: 'origin',
      }
    ],
    labels: []
  };

  errorTrendChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    },
    plugins: {
      legend: {
        display: true,
      }
    }
  };

  // エラータイプの円グラフ
  errorTypeChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)'
      ]
    }]
  };

  errorTypeChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      }
    }
  };

  // 時間帯別エラー発生グラフ
  hourlyErrorChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [],
        label: '時間帯別エラー数',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ],
    labels: Array.from({length: 24}, (_, i) => `${i}:00`)
  };

  hourlyErrorChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  // ユーザー影響度グラフ
  userImpactChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [],
        label: 'ユーザー別エラー数',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1
      }
    ],
    labels: []
  };

  userImpactChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  constructor(private errorAnalysisService: ErrorAnalysisService) {}

  async ngOnInit(): Promise<void> {
    await this.loadErrorAnalysis();
  }

  private async loadErrorAnalysis(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      this.errorAnalysis = await this.errorAnalysisService.analyzeErrors();
      this.updateCharts();
    } catch (error) {
      this.error = 'エラー分析の読み込みに失敗しました';
      console.error('エラー分析の読み込みに失敗しました:', error);
    } finally {
      this.loading = false;
    }
  }

  private updateCharts(): void {
    if (!this.errorAnalysis) return;

    // エラー発生率の時系列データを更新
    this.errorTrendChartData.labels = this.errorAnalysis.errorTrends.map(trend => trend.date);
    this.errorTrendChartData.datasets[0].data = this.errorAnalysis.errorTrends.map(trend => trend.count);

    // エラータイプの分布データを更新
    const errorTypes = Object.entries(this.errorAnalysis.errorTypes);
    this.errorTypeChartData.labels = errorTypes.map(([type]) => type);
    this.errorTypeChartData.datasets[0].data = errorTypes.map(([, count]) => count);

    // 時間帯別エラー発生データを更新
    this.hourlyErrorChartData.datasets[0].data = this.errorAnalysis.hourlyErrors;

    // ユーザー影響度データを更新
    const userImpacts = Object.entries(this.errorAnalysis.userImpact);
    this.userImpactChartData.labels = userImpacts.map(([userId]) => userId);
    this.userImpactChartData.datasets[0].data = userImpacts.map(([, count]) => count);

    // グラフを更新
    this.chart?.update();
  }
} 