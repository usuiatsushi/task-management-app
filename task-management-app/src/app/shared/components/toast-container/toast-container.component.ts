import { Component } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toastService.toasts$ | async" [class]="toast.type">
        {{ toast.message }}
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .info { background: #2196f3; color: #fff; padding: 12px 24px; border-radius: 4px; }
    .success { background: #4caf50; color: #fff; padding: 12px 24px; border-radius: 4px; }
    .warning { background: #ff9800; color: #fff; padding: 12px 24px; border-radius: 4px; }
    .error { background: #f44336; color: #fff; padding: 12px 24px; border-radius: 4px; }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}
} 