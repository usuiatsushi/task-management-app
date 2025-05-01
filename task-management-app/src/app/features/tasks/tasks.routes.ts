import { Routes } from '@angular/router';
import { TaskListComponent } from './components/task-list/task-list.component';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { TaskDetailComponent } from './components/task-detail/task-detail.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const TASK_ROUTES: Routes = [
  { path: '', component: TaskListComponent },
  { path: 'new', component: TaskFormComponent },
  { path: ':id', component: TaskDetailComponent },
  { path: ':id/edit', component: TaskFormComponent },
  { path: 'dashboard', component: DashboardComponent }
]; 