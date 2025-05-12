import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StakeholderService } from '../../services/stakeholder.service';
import { Stakeholder, StakeholderMatrix } from '../../models/stakeholder.model';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StakeholderDialogComponent } from '../stakeholder-dialog/stakeholder-dialog.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-stakeholder-matrix',
  templateUrl: './stakeholder-matrix.component.html',
  styleUrls: ['./stakeholder-matrix.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class StakeholderMatrixComponent implements OnInit {
  @Input() taskId!: string;
  
  displayedColumns: string[] = ['name', 'role', 'responsibility', 'status', 'actions'];
  stakeholders: Stakeholder[] = [];
  matrix: StakeholderMatrix | null = null;
  loading = false;

  constructor(
    private stakeholderService: StakeholderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  private async loadData() {
    try {
      this.loading = true;
      const [stakeholders, matrix] = await Promise.all([
        this.stakeholderService.getStakeholders(),
        this.stakeholderService.getStakeholderMatrix(this.taskId)
      ]);
      this.stakeholders = stakeholders;
      this.matrix = matrix;
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
      this.snackBar.open('データの読み込みに失敗しました', '閉じる', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  getStakeholderInfo(stakeholderId: string): Stakeholder | undefined {
    return this.stakeholders.find(s => s.id === stakeholderId);
  }

  getStakeholderRole(stakeholderId: string): string {
    const stakeholder = this.matrix?.stakeholders.find(s => s.stakeholderId === stakeholderId);
    return stakeholder?.role || '';
  }

  getStakeholderResponsibility(stakeholderId: string): string {
    const stakeholder = this.matrix?.stakeholders.find(s => s.stakeholderId === stakeholderId);
    return stakeholder?.responsibility || '';
  }

  getStakeholderStatus(stakeholderId: string): string {
    const stakeholder = this.matrix?.stakeholders.find(s => s.stakeholderId === stakeholderId);
    return stakeholder?.status || 'inactive';
  }

  getInfluenceClass(influence: string): string {
    switch (influence) {
      case 'high': return 'influence-high';
      case 'medium': return 'influence-medium';
      case 'low': return 'influence-low';
      default: return '';
    }
  }

  getInterestClass(interest: string): string {
    switch (interest) {
      case 'high': return 'interest-high';
      case 'medium': return 'interest-medium';
      case 'low': return 'interest-low';
      default: return '';
    }
  }

  async openStakeholderDialog() {
    const dialogRef = this.dialog.open(StakeholderDialogComponent, {
      width: '600px',
      data: { taskId: this.taskId }
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      try {
        const stakeholderId = await this.stakeholderService.createStakeholder(result);
        await this.stakeholderService.createStakeholderMatrix({
          taskId: this.taskId,
          stakeholders: [{
            stakeholderId,
            role: result.role,
            responsibility: result.responsibility,
            status: result.status
          }],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        this.snackBar.open('ステークホルダーを追加しました', '閉じる', { duration: 3000 });
        await this.loadData();
      } catch (error) {
        console.error('ステークホルダーの追加に失敗しました:', error);
        this.snackBar.open('ステークホルダーの追加に失敗しました', '閉じる', { duration: 3000 });
      }
    }
  }

  async editStakeholder(stakeholder: Stakeholder) {
    const dialogRef = this.dialog.open(StakeholderDialogComponent, {
      width: '600px',
      data: { stakeholder, taskId: this.taskId }
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      try {
        await this.stakeholderService.updateStakeholder(stakeholder.id, result);
        if (this.matrix) {
          const stakeholderIndex = this.matrix.stakeholders.findIndex(s => s.stakeholderId === stakeholder.id);
          if (stakeholderIndex !== -1) {
            this.matrix.stakeholders[stakeholderIndex] = {
              stakeholderId: stakeholder.id,
              role: result.role,
              responsibility: result.responsibility,
              status: result.status
            };
            await this.stakeholderService.updateStakeholderMatrix(this.matrix.id, this.matrix);
          }
        }
        this.snackBar.open('ステークホルダーを更新しました', '閉じる', { duration: 3000 });
        await this.loadData();
      } catch (error) {
        console.error('ステークホルダーの更新に失敗しました:', error);
        this.snackBar.open('ステークホルダーの更新に失敗しました', '閉じる', { duration: 3000 });
      }
    }
  }

  async removeStakeholder(stakeholder: Stakeholder) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'ステークホルダーの削除',
        message: `${stakeholder.name}を削除してもよろしいですか？`
      }
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      try {
        await this.stakeholderService.deleteStakeholder(stakeholder.id);
        if (this.matrix) {
          this.matrix.stakeholders = this.matrix.stakeholders.filter(s => s.stakeholderId !== stakeholder.id);
          await this.stakeholderService.updateStakeholderMatrix(this.matrix.id, this.matrix);
        }
        this.snackBar.open('ステークホルダーを削除しました', '閉じる', { duration: 3000 });
        await this.loadData();
      } catch (error) {
        console.error('ステークホルダーの削除に失敗しました:', error);
        this.snackBar.open('ステークホルダーの削除に失敗しました', '閉じる', { duration: 3000 });
      }
    }
  }
} 