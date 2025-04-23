import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss']
})
export class TaskFormComponent implements OnInit {
  taskForm: FormGroup;
  isEditMode = false;
  taskId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore
  ) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      status: ['未対応', Validators.required],
      priority: ['中', Validators.required],
      dueDate: ['', Validators.required],
      assignedTo: ['', Validators.required]
    });
  }

  async ngOnInit() {
    this.taskId = this.route.snapshot.paramMap.get('id');
    if (this.taskId) {
      this.isEditMode = true;
      await this.loadTask(this.taskId);
    }
  }

  private async loadTask(taskId: string) {
    const taskRef = doc(this.firestore, 'tasks', taskId);
    const taskSnap = await getDoc(taskRef);
    
    if (taskSnap.exists()) {
      const task = taskSnap.data() as Task;
      this.taskForm.patchValue({
        ...task,
        dueDate: task.dueDate.toDate().toISOString().split('T')[0]
      });
    }
  }

  async onSubmit() {
    if (this.taskForm.valid) {
      const taskData = {
        ...this.taskForm.value,
        dueDate: new Date(this.taskForm.value.dueDate),
        updatedAt: new Date()
      };

      if (this.isEditMode && this.taskId) {
        const taskRef = doc(this.firestore, 'tasks', this.taskId);
        await updateDoc(taskRef, taskData);
      } else {
        const taskRef = doc(collection(this.firestore, 'tasks'));
        await setDoc(taskRef, {
          ...taskData,
          createdAt: new Date()
        });
      }

      this.router.navigate(['/tasks']);
    }
  }
} 