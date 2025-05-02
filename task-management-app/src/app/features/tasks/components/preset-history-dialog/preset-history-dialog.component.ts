import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FilterPresetService, PresetHistory } from '../../services/filter-preset.service';

@Component({
  selector: 'app-preset-history-dialog',
  templateUrl: './preset-history-dialog.component.html',
  styleUrls: ['./preset-history-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ]
})
export class PresetHistoryDialogComponent {
  history: PresetHistory[] = [];
  loading = true;

  constructor(
    private dialogRef: MatDialogRef<PresetHistoryDialogComponent>,
    private filterPresetService: FilterPresetService,
    @Inject(MAT_DIALOG_DATA) public data: { presetId: string }
  ) {
    this.loadHistory();
  }

  private async loadHistory(): Promise<void> {
    try {
      this.history = await this.filterPresetService.getPresetHistory(this.data.presetId);
    } catch (error) {
      console.error('履歴の読み込みに失敗しました:', error);
    } finally {
      this.loading = false;
    }
  }

  formatChange(change: PresetHistory['changes'][0]): string {
    return `${change.field}: ${this.formatValue(change.oldValue)} → ${this.formatValue(change.newValue)}`;
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }
} 