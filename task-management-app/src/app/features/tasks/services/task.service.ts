import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from '@angular/fire/firestore';
import { Task } from '../models/task.model';
import { Timestamp } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  constructor(private firestore: Firestore) {}

  async getTasks(): Promise<Task[]> {
    const tasksCollection = collection(this.firestore, 'tasks');
    const querySnapshot = await getDocs(tasksCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));
  }

  async createTask(task: Omit<Task, 'id'>): Promise<string> {
    const tasksCollection = collection(this.firestore, 'tasks');
    const docRef = await addDoc(tasksCollection, {
      ...task,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  async updateTask(id: string, task: Partial<Task>): Promise<void> {
    const taskDoc = doc(this.firestore, 'tasks', id);
    await updateDoc(taskDoc, {
      ...task,
      updatedAt: Timestamp.now()
    });
  }

  async deleteTask(id: string): Promise<void> {
    const taskDoc = doc(this.firestore, 'tasks', id);
    await deleteDoc(taskDoc);
  }
} 