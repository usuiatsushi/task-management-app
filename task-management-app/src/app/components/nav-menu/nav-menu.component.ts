import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../features/tasks/services/task.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Timestamp } from 'firebase/firestore';
import { Task } from '../../features/tasks/models/task.model';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ProjectService } from '../../features/projects/services/project.service';
import { Project } from '../../features/projects/models/project.model';

// ファイルタイプの列挙型
enum FileType {
  ASANA = 'ASANA',
  TRELLO = 'TRELLO',
  SAMPLE = 'SAMPLE',
  UNKNOWN = 'UNKNOWN'
}

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    RouterModule,
    MatButtonModule
  ]
})
export class NavMenuComponent {
  menuItems = [
    { path: '/tasks', label: 'タスク一覧', icon: 'list' },
    { path: '/tasks/new', label: '新規タスク', icon: 'add' }
  ];

  showExportMenu = false;
  projects: Project[] = [];
  showProjectMenu = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private taskService: TaskService,
    private projectService: ProjectService,
    private snackBar: MatSnackBar
  ) {
    this.projectService.projects$.subscribe(projects => {
      this.projects = projects;
    });
  }

  toggleExportMenu(): void {
    this.showExportMenu = !this.showExportMenu;
  }

  toggleProjectMenu(): void {
    this.showProjectMenu = !this.showProjectMenu;
  }

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
      const headers = ['タイトル', '説明', 'ステータス', '重要度', 'カテゴリ', '担当者', '期限'];
      const rows = tasks.map(task => [
        task.title,
        task.description,
        task.status,
        task.importance,
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
      const headers = ['タイトル', '説明', 'ステータス', '重要度', 'カテゴリ', '担当者', '期限'];
      const rows = tasks.map(task => [
        task.title,
        task.description,
        task.status,
        task.importance,
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

  downloadSampleCSV(): void {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(today.getDate() + 2);
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() + 7);

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    const sampleData = [
      ['タイトル', '説明', 'ステータス', '重要度', 'カテゴリ', '担当者', '期限'],
      ['タスク1', 'サンプルタスク1の説明', '未着手', '高', '技術的課題', '山田太郎', formatDate(twoDaysAgo)],
      ['タスク2', 'サンプルタスク2の説明', '進行中', '中', '業務フロー', '鈴木花子', formatDate(today)],
      ['タスク3', 'サンプルタスク3の説明', '完了', '低', '新機能・改善提案', '佐藤一郎', formatDate(twoDaysLater)],
      ['タスク4', 'サンプルタスク4の説明', '未着手', '高', 'バグ修正', '田中次郎', formatDate(oneWeekLater)],
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_tasks.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.snackBar.open('サンプルCSVファイルをダウンロードしました', '閉じる', { duration: 3000 });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.processFile(file).then(() => {
      // ファイル入力フィールドをリセット
      input.value = '';
      // 入力イベントを強制的に発火
      input.dispatchEvent(new Event('change'));
    });
  }

  private async processFile(file: File): Promise<void> {
    try {
      const content = await file.text();
      const fileType = this.detectFileType(file, content);
      
      switch (fileType) {
        case FileType.ASANA:
          await this.importAsanaCSV(file);
          break;
        case FileType.TRELLO:
          await this.importTrelloCSV(file);
          break;
        case FileType.SAMPLE:
          await this.importSampleCSV(file);
          break;
        default:
          this.snackBar.open('サポートされていないファイル形式です', '閉じる', { duration: 3000 });
      }
    } catch (error) {
      console.error('ファイルの処理に失敗しました:', error);
      this.snackBar.open('ファイルの処理に失敗しました', '閉じる', { duration: 3000 });
    }
  }

  // ファイルタイプを判定するメソッド
  private detectFileType(file: File, content: string): FileType {
    const firstLine = content.split('\n')[0];
    
    // AsanaのCSV判定
    if (firstLine.includes('Name') && firstLine.includes('Section/Column') && firstLine.includes('Assignee')) {
      return FileType.ASANA;
    }
    
    // TrelloのCSV判定
    if (firstLine.includes('Card ID') && firstLine.includes('Card Name') && firstLine.includes('List Name')) {
      return FileType.TRELLO;
    }
    
    // サンプルCSV判定
    if (firstLine.includes('タイトル') && firstLine.includes('説明') && firstLine.includes('ステータス')) {
      return FileType.SAMPLE;
    }
    
    return FileType.UNKNOWN;
  }

  async importAsanaCSV(file: File): Promise<void> {
    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(','));
      const headers = rows[0];

      const tasks = rows.slice(1).map(row => {
        // Asanaのステータスを変換
        const asanaStatus = row[headers.indexOf('Section/Column')] || '';
        let status: '未着手' | '進行中' | '完了';
        switch (asanaStatus) {
          case 'To-Do':
            status = '未着手';
            break;
          case '進行中':
            status = '進行中';
            break;
          case '完了':
            status = '完了';
            break;
          default:
            status = '未着手';
        }

        const taskData: Omit<Task, 'id'> = {
          title: row[headers.indexOf('Name')] || '',
          description: row[headers.indexOf('Notes')] || '',
          status: status,
          importance: row[headers.indexOf('重要度')] as '低' | '中' | '高' || '中',
          category: 'Asana',
          assignedTo: row[headers.indexOf('Assignee')] || '',
          dueDate: row[headers.indexOf('Due Date')]?.trim() ? Timestamp.fromDate(new Date(row[headers.indexOf('Due Date')])) : null,
          userId: '',
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          completed: row[headers.indexOf('完了')] === '完了' || false
        };
        return taskData;
      });

      let successCount = 0;
      for (const task of tasks) {
        try {
          await this.taskService.createTask(task);
          successCount++;
        } catch (error) {
          console.error('Error creating task:', error);
          this.snackBar.open(`タスクの作成に失敗しました: ${task.title}`, '閉じる', {
            duration: 3000
          });
        }
      }

      this.snackBar.open(`${successCount}件のタスクをインポートしました`, '閉じる', {
        duration: 3000
      });
    } catch (error) {
      console.error('Error importing Asana CSV:', error);
      this.snackBar.open('Asana CSVのインポートに失敗しました', '閉じる', {
        duration: 3000
      });
    }
  }

  async importTrelloCSV(file: File): Promise<void> {
    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
      const headers = rows[0];
      
      // ヘッダーのインデックスを取得
      const titleIndex = headers.indexOf('Card Name');
      const descriptionIndex = headers.indexOf('Card Description');
      const statusIndex = headers.indexOf('List Name');
      const dueDateIndex = headers.indexOf('Due Date');
      const assigneeIndex = headers.indexOf('Members');
      const assigneeNameIndex = headers.indexOf('Member Names');

      const tasks = rows.slice(1).map(row => {
        // タイトルが空の場合はスキップ
        if (!row[titleIndex]?.trim()) {
          return null;
        }

        // Trelloのステータスをアプリケーションのステータスに変換
        const trelloStatus = row[statusIndex] || '';
        let status: '未着手' | '進行中' | '完了';
        switch (trelloStatus) {
          case 'To Do':
            status = '未着手';
            break;
          case '作業中':
            status = '進行中';
            break;
          case '完了':
            status = '完了';
            break;
          default:
            status = '未着手';
        }

        // 担当者名を取得（Member Namesカラムがある場合はそれを使用）
        const assignedTo = assigneeNameIndex !== -1 && row[assigneeNameIndex] 
          ? row[assigneeNameIndex].trim() 
          : row[assigneeIndex]?.trim() || '';

        const taskData = {
          title: row[titleIndex]?.trim() || '',
          description: row[descriptionIndex]?.trim() || '',
          status: status as '未着手' | '進行中' | '完了',
          importance: '' as '低' | '中' | '高',
          category: 'Trello',
          assignedTo: assignedTo,
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          userId: '', // 後で設定
          dueDate: row[dueDateIndex]?.trim() ? Timestamp.fromDate(new Date(row[dueDateIndex])) : null,
          completed: row[headers.indexOf('完了')] === '完了' || false
        } as const;

        return taskData;
      }).filter(task => task !== null);

      let successCount = 0;
      for (const task of tasks) {
        try {
          await this.taskService.createTask(task as Task);
          successCount++;
        } catch (error) {
          console.error('Error creating task:', error);
          this.snackBar.open(`タスクの作成に失敗しました: ${task.title}`, '閉じる', {
            duration: 3000
          });
        }
      }

      this.snackBar.open(`${successCount}件のタスクをインポートしました`, '閉じる', {
        duration: 3000
      });
    } catch (error) {
      console.error('Error importing Trello CSV:', error);
      this.snackBar.open('Trello CSVのインポートに失敗しました', '閉じる', {
        duration: 3000
      });
    }
  }

  // 日付バリデーションの共通関数
  private isDueDateBeforeStartDate(startDate: Date, dueDate: Date): boolean {
    const toYMD = (date: Date) => {
      const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      console.log('Converting to UTC:', {
        original: date.toISOString(),
        utc: utcDate.toISOString()
      });
      return utcDate;
    };
    const startDateYMD = toYMD(startDate);
    const dueDateYMD = toYMD(dueDate);
    console.log('Comparing dates:', {
      startDate: startDateYMD.toISOString(),
      dueDate: dueDateYMD.toISOString(),
      isBefore: dueDateYMD.getTime() < startDateYMD.getTime()
    });
    return dueDateYMD.getTime() < startDateYMD.getTime();
  }

  // 日付の妥当性チェックとバリデーション
  private validateTaskDates(startDate: Date | null, dueDate: Date | null, title: string): { isValid: boolean; error?: { title: string; reason: string } } {
    console.log('Validating dates for task:', {
      title,
      startDate: startDate?.toISOString(),
      dueDate: dueDate?.toISOString()
    });
    const isValidStart = startDate instanceof Date && !isNaN(startDate.getTime());
    const isValidDue = dueDate instanceof Date && !isNaN(dueDate.getTime());
    if (!isValidStart || !isValidDue) {
      console.log('Invalid dates:', { isValidStart, isValidDue });
      return { isValid: false };
    }
    if (this.isDueDateBeforeStartDate(startDate, dueDate)) {
      console.log('Due date is before start date');
      return {
        isValid: false,
        error: { title, reason: '開始日より前の期限' }
      };
    }
    console.log('Dates are valid');
    return { isValid: true };
  }

  async importSampleCSV(file: File): Promise<void> {
    console.log('importSampleCSV called');
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(header => header.trim());
      const errorTasks: { title: string; reason: string }[] = [];
      const importDate = new Date();
      const tasks = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(value => value.trim());
        const title = values[headers.indexOf('タイトル')] || '';
        if (!title.trim()) continue;
        const startDateStr = values[headers.indexOf('開始日')] || values[headers.indexOf('startDate')];
        const dueDateStr = values[headers.indexOf('期限')];
        console.log(`row ${i}:`, values);
        console.log(`row ${i} startDateStr:`, startDateStr, 'dueDateStr:', dueDateStr);
        const startDate = startDateStr ? new Date(startDateStr) : importDate;
        const dueDate = dueDateStr ? new Date(dueDateStr) : null;
        console.log('Processing task:', {
          title,
          startDate: startDate.toISOString(),
          dueDate: dueDate?.toISOString(),
          importDate: importDate.toISOString()
        });
        const validation = this.validateTaskDates(startDate, dueDate, title);
        console.log('Validation result:', validation);
        if (!validation.isValid) {
          if (validation.error) {
            console.log('Validation failed:', validation.error);
            errorTasks.push(validation.error);
          }
          continue;
        }
        const task: Omit<Task, 'id'> = {
          title: title,
          description: values[headers.indexOf('説明')] || '',
          status: (values[headers.indexOf('ステータス')] as '未着手' | '進行中' | '完了') || '未着手',
          importance: (values[headers.indexOf('重要度')] as '低' | '中' | '高') || '中',
          category: values[headers.indexOf('カテゴリ')] || '',
          assignedTo: values[headers.indexOf('担当者')] || '',
          dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
          userId: 'user1',
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          completed: values[headers.indexOf('完了')] === '完了' || false,
          startDate: startDate,
          duration: dueDate && startDate ? Math.max(1, Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) : 1
        };
        tasks.push(task);
      }
      console.log('Import summary:', {
        totalTasks: tasks.length,
        errorTasks: errorTasks.length,
        errors: errorTasks
      });
      let successCount = 0;
      for (const task of tasks) {
        try {
          await this.taskService.createTask(task);
          successCount++;
        } catch (error) {
          console.error('タスクの作成に失敗しました:', error);
        }
      }
      if (errorTasks.length > 0) {
        this.snackBar.open(`${errorTasks.length}件のタスクで日付不正のためインポートされませんでした`, '閉じる', { duration: 7000 });
        setTimeout(() => {
          this.snackBar.open(`${successCount}件のタスクをインポートしました`, '閉じる', { duration: 3000 });
        }, 7000);
      } else {
        this.snackBar.open(`${successCount}件のタスクをインポートしました`, '閉じる', { duration: 3000 });
      }
    } catch (error) {
      console.error('CSVインポートエラー:', error);
      this.snackBar.open('CSVのインポートに失敗しました', '閉じる', { duration: 3000 });
    }
  }

  private generateTaskId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  navigateToNewProject(event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/projects/new']);
  }

  navigateToProject(projectId: string): void {
    this.router.navigate(['/projects', projectId, 'tasks']);
  }
} 