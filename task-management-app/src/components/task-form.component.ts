import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="form-field">
      <mat-form-field appearance="outline">
        <mat-label>説明</mat-label>
        <textarea
          matInput
          [formControl]="description"
          rows="4"
          placeholder="説明を入力">
        </textarea>
      </mat-form-field>
    </div>
  `,
  styles: [`
    .form-field {
      position: relative;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
    }

    mat-form-field {
      width: 100%;
    }

    textarea {
      min-height: 120px;
      line-height: 1.5;
      font-size: 14px;
      resize: vertical;
    }
  `]
})
export class TaskFormComponent {
  description = new FormControl('');
} 