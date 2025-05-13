import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-more-tasks-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './more-tasks-dialog.component.html',
  styleUrl: './more-tasks-dialog.component.css'
})
export class MoreTasksDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<MoreTasksDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tasks: any[] }
  ) {}
} 