import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../features/tasks/services/task.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ProjectService } from '../../features/projects/services/project.service';
import { Project } from '../../features/projects/models/project.model';
import { MenuService } from '../../core/services/menu.service';

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
export class NavMenuComponent implements OnInit {
  menuItems = [
    { path: '/tasks', label: 'タスク一覧', icon: 'list' },
    { path: '/tasks/new', label: '新規タスク', icon: 'add' }
  ];

  projects: Project[] = [];
  showProjectMenu = true;
  isMenuOpen = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private taskService: TaskService,
    private projectService: ProjectService,
    private menuService: MenuService,
    private snackBar: MatSnackBar
  ) {
    this.projectService.projects$.subscribe(projects => {
      this.projects = projects;
    });
  }

  ngOnInit(): void {
    this.menuService.isMenuOpen$.subscribe(isOpen => {
      this.isMenuOpen = isOpen;
    });
  }

  toggleProjectMenu(): void {
    this.showProjectMenu = !this.showProjectMenu;
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
    this.menuService.closeMenu();
  }

  async logout(): Promise<void> {
    try {
      await this.authService.signOut();
      this.menuService.closeMenu();
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
    }
  }

  navigateToNewProject(event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/projects/new']);
    this.menuService.closeMenu();
  }

  navigateToProject(projectId: string): void {
    this.router.navigate(['/projects', projectId, 'tasks']);
    this.menuService.closeMenu();
  }
} 