import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Stakeholder } from '../../models/stakeholder.model';

@Component({
  selector: 'app-stakeholder-dialog',
  templateUrl: './stakeholder-dialog.component.html',
  styleUrls: ['./stakeholder-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ]
})
export class StakeholderDialogComponent {
  form: FormGroup;
  isEditMode: boolean;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<StakeholderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { stakeholder?: Stakeholder, taskId: string }
  ) {
    this.isEditMode = !!data.stakeholder;
    this.form = this.fb.group({
      name: [data.stakeholder?.name || '', [Validators.required, Validators.minLength(2)]],
      role: [data.stakeholder?.role || 'observer', Validators.required],
      department: [data.stakeholder?.department || '', Validators.required],
      email: [data.stakeholder?.email || '', [Validators.required, Validators.email]],
      phone: [data.stakeholder?.phone || ''],
      influence: [data.stakeholder?.influence || 'medium', Validators.required],
      interest: [data.stakeholder?.interest || 'medium', Validators.required],
      responsibility: [data.stakeholder?.responsibility || '', Validators.required],
      status: [data.stakeholder?.status || 'active', Validators.required]
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.dialogRef.close({
        ...this.form.value,
        id: this.data.stakeholder?.id
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
} 