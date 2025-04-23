import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, getDocs } from '@angular/fire/firestore';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];

  constructor(private firestore: Firestore) { }

  async ngOnInit() {
    await this.loadTasks();
  }

  private async loadTasks() {
    const tasksRef = collection(this.firestore, 'tasks');
    const q = query(tasksRef);
    const querySnapshot = await getDocs(q);
    
    this.tasks = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));
  }
} 