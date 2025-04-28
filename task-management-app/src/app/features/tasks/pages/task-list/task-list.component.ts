import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { NotificationService } from '../../services/notification.service';
import { Task } from '../../models/task.model';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

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
} 