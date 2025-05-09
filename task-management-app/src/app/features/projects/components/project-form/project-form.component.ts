import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule
  ]
})
export class ProjectFormComponent implements OnInit {
  projectForm: FormGroup;
  isEditMode = false;
  projectId: string | null = null;
taskForm: any;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    if (this.projectId && this.projectId !== 'new') {
      this.isEditMode = true;
      this.loadProject();
    }
  }

  private async loadProject(): Promise<void> {
    if (!this.projectId) return;

    const project = await this.projectService.getProject(this.projectId);
    if (project) {
      this.projectForm.patchValue({
        name: project.name,
        description: project.description
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.projectForm.invalid) return;

    try {
      const projectData = this.projectForm.value;
      if (this.isEditMode && this.projectId) {
        await this.projectService.updateProject(this.projectId, projectData);
        this.snackBar.open('プロジェクトを更新しました', '閉じる', { duration: 3000 });
      } else {
        await this.projectService.createProject(projectData);
        this.snackBar.open('プロジェクトを作成しました', '閉じる', { duration: 3000 });
      }
      this.router.navigate(['/projects']);
    } catch (error) {
      console.error('プロジェクトの保存に失敗しました:', error);
      this.snackBar.open('プロジェクトの保存に失敗しました', '閉じる', { duration: 3000 });
    }
  }

  onCancel(): void {
    this.router.navigate(['/projects']);
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto'; // 一度リセット
    textarea.style.height = textarea.scrollHeight + 'px';
  }
} 