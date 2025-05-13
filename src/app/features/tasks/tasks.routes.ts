import { Routes } from '@angular/router';
import { TaskListComponent } from './components/task-list/task-list.component';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { TaskDetailComponent } from './components/task-detail/task-detail.component';
import { DashboardComponent } from 'src/app/features/dashboard/dashboard.component';
import { AuthGuard } from '../../core/guards/auth.guard';

export const TASK_ROUTES: Routes = [
  {
    path: '',
    component: TaskListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'new',
    component: TaskFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: ':id',
    component: TaskDetailComponent,
    canActivate: [AuthGuard]
  },
  { path: ':id/edit', component: TaskFormComponent },
  { path: 'dashboard', component: DashboardComponent }
]; 