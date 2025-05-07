import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule
  ]
})
export class NavMenuComponent {
  menuItems = [
    { path: '/tasks', label: 'タスク一覧', icon: 'list' },
    { path: '/tasks/new', label: '新規タスク', icon: 'add' },
    { path: '/tasks/completed', label: '完了済みタスク', icon: 'check_circle' }
  ];

  constructor(private router: Router) {}

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
} 