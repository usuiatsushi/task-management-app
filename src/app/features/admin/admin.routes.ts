import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { AdminGuard } from '../auth/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [AdminGuard]
  }
]; 