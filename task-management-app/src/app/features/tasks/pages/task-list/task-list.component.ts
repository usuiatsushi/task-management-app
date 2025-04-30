import { Component, OnInit } from '@angular/core';
import { ImportService, ImportFileType } from '../../services/import.service';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit {
  constructor(private importService: ImportService) {}

  ngOnInit(): void {
    // コンポーネントの初期化処理
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    try {
      await this.importService.importTasks(file);
      alert('タスクのインポートが完了しました');
    } catch (error) {
      console.error('インポートエラー:', error);
      alert('タスクのインポートに失敗しました');
    }
  }
} 