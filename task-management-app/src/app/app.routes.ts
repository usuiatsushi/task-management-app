import { Routes } from '@angular/router';
import { TaskListComponent } from './features/tasks/components/task-list/task-list.component';
import { TaskFormComponent } from './features/tasks/components/task-form/task-form.component';
import { TaskDetailComponent } from './features/tasks/components/task-detail/task-detail.component';
import { DashboardComponent } from './features/tasks/components/dashboard/dashboard.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/tasks',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('../app/features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'tasks',
    loadChildren: () => import('../app/features/tasks/tasks.routes').then(m => m.TASK_ROUTES)
  }
];

export default routes;
