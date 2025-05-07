import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SideMenuComponent } from './shared/components/side-menu/side-menu.component';
import { AuthService } from './features/auth/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
    SideMenuComponent
  ]
})
export class AppComponent {
  isMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onExportCsv(): void {
    // 実装は各コンポーネントで行う
  }

  onExportExcel(): void {
    // 実装は各コンポーネントで行う
  }

  onImportCsv(): void {
    // 実装は各コンポーネントで行う
  }

  onDownloadSampleCsv(): void {
    // 実装は各コンポーネントで行う
  }

  async onLogout(): Promise<void> {
    try {
      console.log('ログアウト処理を開始');
      await this.authService.logout();
      console.log('ログアウト処理が完了、ログイン画面に遷移します');
      await this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
    }
  }
}
