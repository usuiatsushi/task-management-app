import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, ChartEvent, ActiveElement } from 'chart.js';
import { ErrorAnalysisService, ErrorAnalysis } from '../../services/error-analysis.service';
import { FilterPresetService, FilterPreset } from '../../services/filter-preset.service';
import { ErrorDetailsDialogComponent } from '../error-details-dialog/error-details-dialog.component';
import { FilterPresetDialogComponent } from '../filter-preset-dialog/filter-preset-dialog.component';

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
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    BaseChartDirective
  ]
})
export class ErrorAnalysisComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  loading = false;
  error: string | null = null;
  errorAnalysis: ErrorAnalysis | null = null;
  analysisForm: FormGroup;
  filterForm: FormGroup;

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

  constructor(
    private errorAnalysisService: ErrorAnalysisService,
    private filterPresetService: FilterPresetService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.analysisForm = this.fb.group({
      startDate: [new Date(new Date().setDate(new Date().getDate() - 30))],
      endDate: [new Date()]
    });

    this.filterForm = this.fb.group({
      errorType: [''],
      minErrorCount: [0],
      userFilter: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadErrorAnalysis();
    this.setupFilterListeners();
    this.checkUrlParams();
  }

  private checkUrlParams(): void {
    const preset = this.filterPresetService.parseShareUrl();
    if (preset.errorType || preset.minErrorCount || preset.userFilter) {
      this.filterForm.patchValue(preset);
    }
  }

  private setupFilterListeners(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  openFilterPresetDialog(): void {
    const dialogRef = this.dialog.open(FilterPresetDialogComponent, {
      width: '500px',
      data: { currentFilters: this.filterForm.value }
    });

    dialogRef.afterClosed().subscribe((preset: FilterPreset | undefined) => {
      if (preset) {
        this.filterForm.patchValue({
          errorType: preset.errorType,
          minErrorCount: preset.minErrorCount,
          userFilter: preset.userFilter
        });
      }
    });
  }

  private applyFilters(): void {
    if (!this.errorAnalysis) return;

    const { errorType, minErrorCount, userFilter } = this.filterForm.value;

    // エラータイプのフィルタリング
    if (errorType) {
      this.errorTypeChartData.labels = [errorType];
      this.errorTypeChartData.datasets[0].data = [this.errorAnalysis.errorTypes[errorType]];
    } else {
      const errorTypes = Object.entries(this.errorAnalysis.errorTypes);
      this.errorTypeChartData.labels = errorTypes.map(([type]) => type);
      this.errorTypeChartData.datasets[0].data = errorTypes.map(([, count]) => count);
    }

    // 最小エラー数のフィルタリング
    if (minErrorCount > 0) {
      const filteredUserImpact = this.errorAnalysis.userImpact.filter(
        impact => impact.errorCount >= minErrorCount
      );
      this.userImpactChartData.labels = filteredUserImpact.map(impact => impact.userId);
      this.userImpactChartData.datasets[0].data = filteredUserImpact.map(impact => impact.errorCount);
    } else {
      this.userImpactChartData.labels = this.errorAnalysis.userImpact.map(impact => impact.userId);
      this.userImpactChartData.datasets[0].data = this.errorAnalysis.userImpact.map(impact => impact.errorCount);
    }

    // ユーザーフィルタリング
    if (userFilter) {
      const filteredHourlyErrors = this.errorAnalysis.hourlyErrors.map((count, hour) => {
        const userErrors = this.errorAnalysis?.recentErrors.filter(
          error => error.userId === userFilter && error.timestamp.toDate().getHours() === hour
        ).length || 0;
        return userErrors;
      });
      this.hourlyErrorChartData.datasets[0].data = filteredHourlyErrors;
    } else {
      this.hourlyErrorChartData.datasets[0].data = this.errorAnalysis.hourlyErrors;
    }

    this.chart?.update();
  }

  async loadErrorAnalysis(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      const { startDate, endDate } = this.analysisForm.value;
      this.errorAnalysis = await this.errorAnalysisService.analyzeErrors(startDate, endDate);
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
    this.userImpactChartData.labels = this.errorAnalysis.userImpact.map(impact => impact.userId);
    this.userImpactChartData.datasets[0].data = this.errorAnalysis.userImpact.map(impact => impact.errorCount);

    // グラフを更新
    this.chart?.update();
  }

  // グラフのクリックイベントハンドラ
  onChartClick(event: any, chartType: string): void {
    if (!event.active || event.active.length === 0) return;

    const element = event.active[0];
    const index = element.index;

    switch (chartType) {
      case 'errorType':
        const errorType = this.errorTypeChartData.labels?.[index];
        if (errorType) {
          this.showErrorDetails(errorType as string);
        }
        break;
      case 'hourly':
        const hour = this.hourlyErrorChartData.labels?.[index];
        if (hour) {
          this.snackBar.open(`時間帯 ${hour} のエラー数: ${this.errorAnalysis?.hourlyErrors[index]}件`, '閉じる', {
            duration: 3000
          });
        }
        break;
      case 'userImpact':
        const userId = this.userImpactChartData.labels?.[index];
        if (userId) {
          this.snackBar.open(`ユーザー ${userId} のエラー数: ${this.errorAnalysis?.userImpact[index].errorCount}件`, '閉じる', {
            duration: 3000
          });
        }
        break;
    }
  }

  // エラー詳細を表示
  private showErrorDetails(errorCode: string): void {
    this.dialog.open(ErrorDetailsDialogComponent, {
      width: '800px',
      data: { errorCode }
    });
  }

  // 分析データをCSVとしてエクスポート
  exportToCSV(): void {
    if (!this.errorAnalysis) return;

    const csvContent = this.generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `error-analysis-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private generateCSVContent(): string {
    if (!this.errorAnalysis) return '';

    const headers = ['項目', '値'];
    const rows = [
      ['総エラー数', this.errorAnalysis.totalErrors.toString()],
      ...Object.entries(this.errorAnalysis.errorTypes).map(([type, count]) => [type, count.toString()]),
      ...this.errorAnalysis.userImpact.map(impact => [`ユーザー ${impact.userId}`, impact.errorCount.toString()]),
      ...this.errorAnalysis.hourlyErrors.map((count, hour) => [`時間帯 ${hour}:00`, count.toString()])
    ];

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
} 