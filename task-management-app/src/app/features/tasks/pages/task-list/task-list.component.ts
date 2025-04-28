import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { NotificationService } from '../../services/notification.service';
import { Task } from '../../models/task.model';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  displayedColumns: string[] = ['title', 'status', 'dueDate', 'priority', 'actions'];

  constructor(
    private taskService: TaskService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  private loadTasks(): void {
    this.taskService.getTasks().then(tasks => {
      this.tasks = tasks;
      this.notificationService.checkTaskDeadlines(tasks);
    });
  }

  deleteTask(id: string): void {
    if (confirm('このタスクを削除してもよろしいですか？')) {
      this.taskService.deleteTask(id).then(() => {
        this.loadTasks();
      });
    }
  }

  exportTasksToCSV(): void {
    const headers = ['タイトル', '説明', 'ステータス', '優先度', 'カテゴリ', '担当者', '期限'];
    const rows = this.tasks.map(task => [
      task.title,
      task.description,
      task.status,
      task.priority,
      task.category,
      task.assignedTo,
      task.dueDate instanceof Timestamp ? task.dueDate.toDate().toLocaleDateString() : task.dueDate
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportTasksToExcel(): Promise<void> {
    const headers = ['タイトル', '説明', 'ステータス', '優先度', 'カテゴリ', '担当者', '期限'];
    const rows = this.tasks.map(task => [
      task.title,
      task.description,
      task.status,
      task.priority,
      task.category,
      task.assignedTo,
      task.dueDate instanceof Timestamp ? task.dueDate.toDate().toLocaleDateString() : task.dueDate
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
  }
} 