import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Task } from '../../models/task.model';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-bulk-edit-dialog',
  templateUrl: './bulk-edit-dialog.component.html',
  styleUrls: ['./bulk-edit-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule
  ]
})
export class BulkEditDialogComponent {
  editForm: FormGroup;
  categories: string[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<BulkEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tasks: Task[] },
    private categoryService: CategoryService
  ) {
    this.editForm = this.fb.group({
      status: [''],
      priority: [''],
      category: ['']
    });

    this.loadCategories();
  }

  private loadCategories(): void {
    this.categoryService.categories$.subscribe(categories => {
      this.categories = categories;
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.editForm.value);
  }
} 