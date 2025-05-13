import { Component } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-toast-container',
  template: `
    <ng-container *ngIf="(toastService.toasts$ | async) as toasts">
      <ng-container *ngIf="toasts.length > 0">
        <div class="toast-overlay" (click)="toastService.clearAll()"></div>
        <div class="toast-container">
          <div
            *ngFor="let toast of toasts"
            class="toast"
            [ngStyle]="getStyle(toast.type)"
          >
            <span class="message">{{ toast.message }}</span>
            <button mat-button (click)="toastService.remove(toast.id)" class="close-button">
              確認
            </button>
          </div>
        </div>
      </ng-container>
    </ng-container>
  `,
  styles: [`
    .toast-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.3);
      z-index: 9998;
    }

    .toast-container {
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 24px;
      border-radius: 8px;
      min-width: 300px;
      justify-content: space-between;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .message {
      flex: 1;
      font-weight: 500;
    }

    .close-button {
      color: white !important;
      margin-left: 16px;
      opacity: 0.9;
      transition: opacity 0.2s;
    }

    .close-button:hover {
      opacity: 1;
    }
  `],
  standalone: true,
  imports: [CommonModule, MatButtonModule]
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}

  getStyle(type: string | undefined) {
    switch (type) {
      case 'info':
        return { background: '#2196f3', color: 'white' };
      case 'success':
        return { background: '#4caf50', color: 'white' };
      case 'warning':
        return { background: '#ff9800', color: 'white' };
      case 'error':
        return { background: '#f44336', color: 'white' };
      default:
        return { background: '#2196f3', color: 'white' };
    }
  }
} 