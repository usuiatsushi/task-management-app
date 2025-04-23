import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule
  ]
})
export class TaskListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['title', 'category', 'status', 'priority', 'dueDate', 'actions'];
  dataSource = new MatTableDataSource<any>();
  loading = false;
  filterForm: FormGroup;
  searchControl: FormControl;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private taskService: TaskService,
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.searchControl = new FormControl('');
    this.filterForm = this.fb.group({
      category: [''],
      status: [''],
      priority: [''],
      search: this.searchControl
    });
  }

  ngOnInit(): void {
    this.loadTasks();
    this.setupFilterForm();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  private setupFilterForm(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  async loadTasks(): Promise<void> {
    this.loading = true;
    try {
      const tasks = await this.taskService.getTasks();
      this.dataSource.data = tasks;
      this.dataSource.filterPredicate = this.createFilter();
    } catch (error) {
      console.error('タスクの読み込みに失敗しました:', error);
      this.snackBar.open('タスクの読み込みに失敗しました', '閉じる', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  private createFilter(): (data: any, filter: string) => boolean {
    return (data: any) => {
      const filters = this.filterForm.value;
      const categoryMatch = !filters.category || data.category === filters.category;
      const statusMatch = !filters.status || data.status === filters.status;
      const priorityMatch = !filters.priority || data.priority === filters.priority;
      const searchMatch = !filters.search || 
        data.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (data.description && data.description.toLowerCase().includes(filters.search.toLowerCase()));

      return categoryMatch && statusMatch && priorityMatch && searchMatch;
    };
  }

  getUniqueCategories(): string[] {
    const categories = this.dataSource.data.map(task => task.category);
    return [...new Set(categories)];
  }

  getStatusClass(status: string): string {
    switch (status) {
      case '未着手':
        return 'status-not-started';
      case '進行中':
        return 'status-in-progress';
      case '完了':
        return 'status-completed';
      default:
        return '';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case '低':
        return 'priority-low';
      case '中':
        return 'priority-medium';
      case '高':
        return 'priority-high';
      default:
        return '';
    }
  }

  applyFilters(): void {
    this.dataSource.filter = 'trigger';
  }

  resetFilters(): void {
    this.filterForm.reset();
  }

  viewTask(task: any): void {
    this.router.navigate(['/tasks', task.id]);
  }

  navigateToNewTask(): void {
    this.router.navigate(['/tasks/new']);
  }

  async deleteTask(task: any, event: Event): Promise<void> {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'タスクの削除',
        message: `「${task.title}」を削除してもよろしいですか？`,
        confirmText: '削除',
        cancelText: 'キャンセル'
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          await this.taskService.deleteTask(task.id);
          this.snackBar.open('タスクを削除しました', '閉じる', { duration: 3000 });
          this.loadTasks();
        } catch (error) {
          console.error('タスクの削除に失敗しました:', error);
          this.snackBar.open('タスクの削除に失敗しました', '閉じる', { duration: 3000 });
        }
      }
    });
  }
} 