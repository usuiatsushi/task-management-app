import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, orderBy, getDocs } from '@angular/fire/firestore';
import { Task } from '../../models/task.model';
import { Router } from '@angular/router';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  tasks: (Task & { dueDate: Date; createdAt: Date; updatedAt: Date })[] = [];
  filteredTasks: (Task & { dueDate: Date; createdAt: Date; updatedAt: Date })[] = [];
  loading = true;

  // フィルター用の状態
  statusFilter: string = '';
  priorityFilter: string = '';
  categoryFilter: string = '';
  searchQuery: string = '';

  // ソート用の状態
  sortField: string = 'dueDate';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private firestore: Firestore,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.loadTasks();
    this.loading = false;
  }

  private async loadTasks() {
    const tasksRef = collection(this.firestore, 'tasks');
    const q = query(tasksRef, orderBy('dueDate', 'asc'));
    const querySnapshot = await getDocs(q);
    
    this.tasks = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dueDate: this.convertTimestampToDate(data['dueDate']),
        createdAt: this.convertTimestampToDate(data['createdAt']),
        updatedAt: this.convertTimestampToDate(data['updatedAt'])
      } as Task & { dueDate: Date; createdAt: Date; updatedAt: Date };
    });
    
    this.applyFilters();
  }

  private convertTimestampToDate(timestamp: any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return timestamp;
  }

  applyFilters() {
    this.filteredTasks = this.tasks.filter(task => {
      const matchesStatus = !this.statusFilter || task.status === this.statusFilter;
      const matchesPriority = !this.priorityFilter || task.priority === this.priorityFilter;
      const matchesCategory = !this.categoryFilter || task.category === this.categoryFilter;
      const matchesSearch = !this.searchQuery || 
        task.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(this.searchQuery.toLowerCase());

      return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
    });

    this.sortTasks();
  }

  sortTasks() {
    this.filteredTasks.sort((a, b) => {
      const aValue = a[this.sortField as keyof Task];
      const bValue = b[this.sortField as keyof Task];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return this.sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return this.sortDirection === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      return 0;
    });
  }

  onSort(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.sortTasks();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  getUniqueCategories(): string[] {
    const categories = new Set<string>();
    this.tasks.forEach(task => {
      if (task.category) {
        categories.add(task.category);
      }
    });
    return Array.from(categories);
  }

  navigateToTask(taskId: string | undefined) {
    if (taskId) {
      this.router.navigate(['/tasks', taskId]);
    }
  }

  navigateToNewTask() {
    this.router.navigate(['/tasks/new']);
  }
} 