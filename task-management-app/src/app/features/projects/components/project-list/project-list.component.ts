import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TaskService } from 'src/app/features/tasks/services/task.service';
import { Task } from 'src/app/features/tasks/models/task.model';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ]
})
export class ProjectListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'description', 'tasks', 'actions'];
  projects: Project[] = [];
  tasks: Task[] = [];

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.projectService.projects$.subscribe(projects => {
      this.projects = projects;
    });
    this.taskService.tasks$.subscribe(tasks => {
      this.tasks = tasks;
      console.log('全タスク:', this.tasks);
    });
  }

  navigateToNewProject(): void {
    this.router.navigate(['/projects/new']);
  }

  viewProject(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  async deleteProject(project: Project): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'プロジェクトの削除',
        message: `「${project.name}」を削除してもよろしいですか？`,
        confirmText: '削除',
        cancelText: 'キャンセル'
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          await this.projectService.deleteProject(project.id);
          this.snackBar.open('プロジェクトを削除しました', '閉じる', { duration: 3000 });
        } catch (error) {
          console.error('プロジェクトの削除に失敗しました:', error);
          this.snackBar.open('プロジェクトの削除に失敗しました', '閉じる', { duration: 3000 });
        }
      }
    });
  }

  getTaskCount(projectId: string): number {
    const filtered = this.tasks.filter(task => String(task.projectId) === String(projectId));
    this.tasks.forEach(task => {
      console.log(
        '[DEBUG] projectId:', projectId, 'typeof:', typeof projectId,
        '| task.projectId:', task.projectId, 'typeof:', typeof task.projectId
      );
    });
    console.log('projectId:', projectId, 'filtered tasks:', filtered);
    return filtered.length;
  }
} 