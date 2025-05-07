import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../features/tasks/services/task.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatDividerModule
  ]
})
export class NavMenuComponent {
  menuItems = [
    { path: '/tasks', label: 'タスク一覧', icon: 'list' },
    { path: '/tasks/new', label: '新規タスク', icon: 'add' },
    { path: '/tasks/completed', label: '完了済みタスク', icon: 'check_circle' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private taskService: TaskService,
    private snackBar: MatSnackBar
  ) {}

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  async logout(): Promise<void> {
    try {
      await this.authService.signOut();
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
    }
  }

  async exportToCSV(): Promise<void> {
    try {
      const tasks = await this.taskService.getTasks();
      const headers = ['タイトル', '説明', 'ステータス', '優先度', 'カテゴリ', '担当者', '期限'];
      const rows = tasks.map(task => [
        task.title,
        task.description,
        task.status,
        task.priority,
        task.category,
        task.assignedTo,
        task.dueDate instanceof Date ? task.dueDate.toLocaleDateString() : 
          (typeof task.dueDate === 'object' && task.dueDate && 'seconds' in task.dueDate) ? 
            new Date(task.dueDate.seconds * 1000).toLocaleDateString() : ''
      ]);
      const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tasks.csv';
      a.click();
      URL.revokeObjectURL(url);
      this.snackBar.open('CSVファイルをエクスポートしました', '閉じる', { duration: 3000 });
    } catch (error) {
      console.error('CSVのエクスポートに失敗しました:', error);
      this.snackBar.open('CSVのエクスポートに失敗しました', '閉じる', { duration: 3000 });
    }
  }

  async exportToExcel(): Promise<void> {
    try {
      const tasks = await this.taskService.getTasks();
      const headers = ['タイトル', '説明', 'ステータス', '優先度', 'カテゴリ', '担当者', '期限'];
      const rows = tasks.map(task => [
        task.title,
        task.description,
        task.status,
        task.priority,
        task.category,
        task.assignedTo,
        task.dueDate instanceof Date ? task.dueDate.toLocaleDateString() : 
          (typeof task.dueDate === 'object' && task.dueDate && 'seconds' in task.dueDate) ? 
            new Date(task.dueDate.seconds * 1000).toLocaleDateString() : ''
      ]);
      const worksheetData = [headers, ...rows];
      const xlsx = await import('xlsx');
      const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Tasks');
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tasks.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      this.snackBar.open('Excelファイルをエクスポートしました', '閉じる', { duration: 3000 });
    } catch (error) {
      console.error('Excelのエクスポートに失敗しました:', error);
      this.snackBar.open('Excelのエクスポートに失敗しました', '閉じる', { duration: 3000 });
    }
  }
} 