import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { FilterPresetService, FilterPreset } from '../../services/filter-preset.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatSelectModule,
    MatChipsModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    FormsModule,
    MatSnackBarModule,
    MatTooltipModule
  ]
})
export class FilterPresetDialogComponent {
  presetForm: FormGroup;
  presets: FilterPreset[] = [];
  categories: string[] = [];
  searchTerm = '';
  selectedCategory = '';
  selectedPresets: string[] = [];
  isBulkMode = false;
  filteredPresets: FilterPreset[] = [];

  constructor(
    private dialogRef: MatDialogRef<FilterPresetDialogComponent>,
    private filterPresetService: FilterPresetService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { currentFilters: any }
  ) {
    this.presetForm = this.fb.group({
      name: [''],
      category: [''],
      tags: [[]]
    });

    this.filterPresetService.presets$.subscribe(presets => {
      this.presets = presets;
      this.updateFilteredPresets();
    });

    this.filterPresetService.categories$.subscribe(categories => {
      this.categories = categories;
    });
  }

  private updateFilteredPresets(): void {
    this.filterPresetService.searchPresets(this.searchTerm, this.selectedCategory)
      .subscribe(presets => {
        this.filteredPresets = presets;
      });
  }

  addTag(event: any): void {
    const value = (event.value || '').trim();
    if (value) {
      const tags = this.presetForm.get('tags')?.value || [];
      if (!tags.includes(value)) {
        tags.push(value);
        this.presetForm.get('tags')?.setValue(tags);
      }
    }
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    const tags = this.presetForm.get('tags')?.value || [];
    const index = tags.indexOf(tag);
    if (index >= 0) {
      tags.splice(index, 1);
      this.presetForm.get('tags')?.setValue(tags);
    }
  }

  async savePreset(): Promise<void> {
    try {
      const preset: Omit<FilterPreset, 'id' | 'createdAt'> = {
        name: this.presetForm.value.name,
        category: this.presetForm.value.category,
        tags: this.presetForm.value.tags,
        ...this.data.currentFilters,
        createdBy: 'current-user' // TODO: 実際のユーザーIDを使用
      };
      await this.filterPresetService.savePreset(preset);
      this.snackBar.open('プリセットを保存しました', '閉じる', { duration: 3000 });
      this.presetForm.reset();
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

  async deleteSelectedPresets(): Promise<void> {
    try {
      await this.filterPresetService.deletePresets(this.selectedPresets);
      this.snackBar.open('選択したプリセットを削除しました', '閉じる', { duration: 3000 });
      this.selectedPresets = [];
      this.isBulkMode = false;
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

  toggleBulkMode(): void {
    this.isBulkMode = !this.isBulkMode;
    if (!this.isBulkMode) {
      this.selectedPresets = [];
    }
  }

  togglePresetSelection(id: string): void {
    const index = this.selectedPresets.indexOf(id);
    if (index === -1) {
      this.selectedPresets.push(id);
    } else {
      this.selectedPresets.splice(index, 1);
    }
  }
} 