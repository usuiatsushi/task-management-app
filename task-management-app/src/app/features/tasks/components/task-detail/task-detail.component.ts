import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
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
} 