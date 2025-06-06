import { Routes } from '@angular/router';
import { TaskListComponent } from './features/tasks/components/task-list/task-list.component';
import { TaskFormComponent } from './features/tasks/components/task-form/task-form.component';
import { TaskDetailComponent } from './features/tasks/components/task-detail/task-detail.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { RegisterComponent } from './features/auth/components/register/register.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { ADMIN_ROUTES } from './features/admin/admin.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'projects',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('../app/features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'tasks',
    loadChildren: () => import('../app/features/tasks/tasks.routes').then(m => m.TASK_ROUTES)
  },
  {
    path: 'tasks',
    loadComponent: () => import('./features/tasks/components/task-list/task-list.component').then(m => m.TaskListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'tasks/new',
    loadComponent: () => import('./features/tasks/components/task-form/task-form.component').then(m => m.TaskFormComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'tasks/:id',
    loadComponent: () => import('./features/tasks/components/task-form/task-form.component').then(m => m.TaskFormComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'projects',
    loadComponent: () => import('./features/projects/components/project-list/project-list.component').then(m => m.ProjectListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'projects/new',
    loadComponent: () => import('./features/projects/components/project-form/project-form.component').then(m => m.ProjectFormComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./features/projects/components/project-form/project-form.component').then(m => m.ProjectFormComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'projects/:id/tasks',
    loadComponent: () => import('./features/tasks/components/task-list/task-list.component').then(m => m.TaskListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'projects/:id/tasks/new',
    loadComponent: () => import('./features/tasks/components/task-form/task-form.component').then(m => m.TaskFormComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login.component').then(m => m.LoginComponent)
  },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'auth/login', component: LoginComponent },
  {
    path: 'admin',
    children: ADMIN_ROUTES
  }
];

export default routes;
