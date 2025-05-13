import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
// Material UIのインポートは必要に応じて追加

interface ComponentData {
  title: string;
  description: string;
}

@Component({
  selector: 'app-component-name',
  templateUrl: './component.template.html',
  styleUrls: ['./component.template.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class ComponentNameComponent implements OnInit {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      title: [''],
      description: ['']
    });
  }

  ngOnInit(): void {
    // 初期化処理をここに記述
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formData: ComponentData = this.form.value;
      console.log('Form submitted:', formData);
    }
  }

  onCancel(): void {
    this.form.reset();
  }
} 