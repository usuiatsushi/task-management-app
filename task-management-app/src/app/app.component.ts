import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { ToastService } from './shared/services/toast.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    ToastContainerComponent
  ],
  template: `
    <mat-toolbar color="primary">
      <span>タスク管理アプリ</span>
      <span class="spacer"></span>
      <button mat-icon-button routerLink="/analytics">
        <mat-icon>analytics</mat-icon>
      </button>
    </mat-toolbar>
    <main>
      <router-outlet></router-outlet>
    </main>
    <app-toast-container></app-toast-container>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
    main {
      padding: 20px;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'task-management-app';

  constructor(private toastService: ToastService) {
    // セキュリティ設定を適用
    if (environment.security) {
      // Cross-Origin-Opener-Policy
      const coopMeta = document.createElement('meta');
      coopMeta.httpEquiv = 'Cross-Origin-Opener-Policy';
      coopMeta.content = environment.security.crossOriginOpenerPolicy;
      document.head.appendChild(coopMeta);

      // Cross-Origin-Embedder-Policy
      const coepMeta = document.createElement('meta');
      coepMeta.httpEquiv = 'Cross-Origin-Embedder-Policy';
      coepMeta.content = environment.security.crossOriginEmbedderPolicy;
      document.head.appendChild(coepMeta);
    }
  }

  ngOnInit() {
    // セキュリティ設定の適用は完了
  }
}
