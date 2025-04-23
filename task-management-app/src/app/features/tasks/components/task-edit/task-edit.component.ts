import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-edit',
  templateUrl: './task-edit.component.html',
  styleUrls: ['./task-edit.component.scss']
})
export class TaskEditComponent implements OnInit {
  taskForm: FormGroup;
  task: Task | null = null;
  loading = true;
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private firestore: Firestore
  ) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['', Validators.required],
      priority: ['', Validators.required],
      category: [''],
      assignedTo: [''],
      dueDate: ['', Validators.required]
    });
  }

  async ngOnInit() {
    const taskId = this.route.snapshot.paramMap.get('id');
    if (taskId) {
      await this.loadTask(taskId);
    }
    this.loading = false;
  }

  private async loadTask(taskId: string) {
    const taskRef = doc(this.firestore, 'tasks', taskId);
    const taskSnap = await getDoc(taskRef);
    
    if (taskSnap.exists()) {
      this.task = {
        id: taskSnap.id,
        ...taskSnap.data()
      } as Task;
      this.taskForm.patchValue(this.task);
    }
  }

  async onSubmit() {
    if (this.taskForm.invalid || !this.task?.id) return;

    try {
      this.saving = true;
      const taskRef = doc(this.firestore, 'tasks', this.task.id);
      await updateDoc(taskRef, {
        ...this.taskForm.value,
        updatedAt: new Date()
      });
      this.router.navigate(['/tasks', this.task.id]);
    } catch (error) {
      console.error('タスクの更新に失敗しました:', error);
      alert('タスクの更新に失敗しました。もう一度お試しください。');
    } finally {
      this.saving = false;
    }
  }
} 