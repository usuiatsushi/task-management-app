import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h2>ダッシュボード</h2>
      <!-- ダッシュボードの内容はここに実装 -->
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 20px;
    }
  `]
})
export class DashboardComponent {} 