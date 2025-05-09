import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-detail-dialog',
  standalone: true,
  imports: [],
  templateUrl: './task-detail-dialog.component.html',
  styleUrl: './task-detail-dialog.component.css'
})
export class TaskDetailDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { task: Task }) {}
}
