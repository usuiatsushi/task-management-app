import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc, deleteDoc } from '@angular/fire/firestore';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent implements OnInit {
  task: Task | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore
  ) { }

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
    }
  }

  async deleteTask() {
    if (this.task?.id) {
      const taskRef = doc(this.firestore, 'tasks', this.task.id);
      await deleteDoc(taskRef);
      this.router.navigate(['/tasks']);
    }
  }
} 