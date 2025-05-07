import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule
  ]
})
export class SideMenuComponent {
  @Output() exportCsv = new EventEmitter<void>();
  @Output() exportExcel = new EventEmitter<void>();
  @Output() importCsv = new EventEmitter<void>();
  @Output() downloadSampleCsv = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  onExportCsv(): void {
    this.exportCsv.emit();
  }

  onExportExcel(): void {
    this.exportExcel.emit();
  }

  onImportCsv(): void {
    this.importCsv.emit();
  }

  onDownloadSampleCsv(): void {
    this.downloadSampleCsv.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }
} 