import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FilterPresetService, FilterPreset } from '../../services/filter-preset.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-filter-preset-dialog',
  templateUrl: './filter-preset-dialog.component.html',
  styleUrls: ['./filter-preset-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ]
})
export class FilterPresetDialogComponent {
  presetForm: FormGroup;
  presets: FilterPreset[] = [];

  constructor(
    private dialogRef: MatDialogRef<FilterPresetDialogComponent>,
    private filterPresetService: FilterPresetService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { currentFilters: any }
  ) {
    this.presetForm = this.fb.group({
      name: ['']
    });

    this.filterPresetService.presets$.subscribe(presets => {
      this.presets = presets;
    });
  }

  async savePreset(): Promise<void> {
    try {
      const preset: Omit<FilterPreset, 'id' | 'createdAt'> = {
        name: this.presetForm.value.name,
        ...this.data.currentFilters,
        createdBy: 'current-user' // TODO: 実際のユーザーIDを使用
      };
      await this.filterPresetService.savePreset(preset);
      this.snackBar.open('プリセットを保存しました', '閉じる', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('プリセットの保存に失敗しました', '閉じる', { duration: 3000 });
    }
  }

  async deletePreset(id: string): Promise<void> {
    try {
      await this.filterPresetService.deletePreset(id);
      this.snackBar.open('プリセットを削除しました', '閉じる', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('プリセットの削除に失敗しました', '閉じる', { duration: 3000 });
    }
  }

  applyPreset(preset: FilterPreset): void {
    this.dialogRef.close(preset);
  }

  sharePreset(preset: FilterPreset): void {
    const shareUrl = this.filterPresetService.generateShareUrl(preset);
    navigator.clipboard.writeText(shareUrl).then(() => {
      this.snackBar.open('共有URLをクリップボードにコピーしました', '閉じる', { duration: 3000 });
    });
  }
} 