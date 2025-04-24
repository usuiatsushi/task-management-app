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
    console.log('Fetching tasks from Firestore...');
    const tasksCollection = collection(this.firestore, 'tasks');
    const querySnapshot = await getDocs(tasksCollection);
    const tasks = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      const docRef = doc(this.firestore, 'tasks', docSnapshot.id);
      console.log('Raw task data:', data);

      // 現在のタイムスタンプを作成
      const now = new Date();
      const defaultTimestamp = new Timestamp(Math.floor(now.getTime() / 1000), 0);

      // 1週間後の日付を作成
      const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const defaultDueDate = new Timestamp(Math.floor(oneWeekLater.getTime() / 1000), 0);

      let needsUpdate = false;
      const processedData = {
        ...data,
        id: docSnapshot.id,
        createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'] : defaultTimestamp,
        updatedAt: data['updatedAt'] instanceof Timestamp ? data['updatedAt'] : defaultTimestamp,
        dueDate: data['dueDate'] instanceof Timestamp ? data['dueDate'] : defaultDueDate,
        title: data['title'] || '',
        description: data['description'] || '',
        status: data['status'] || '未着手',
        priority: data['priority'] || '中',
        category: data['category'] || 'その他',
        assignedTo: data['assignedTo'] || ''
      };

      // 1970年の日付をチェック
      const epochStart = new Date(1970, 0, 1).getTime();
      if (!data['dueDate'] || 
          (processedData.dueDate instanceof Timestamp && 
           processedData.dueDate.toDate().getTime() <= epochStart)) {
        processedData.dueDate = defaultDueDate;
        needsUpdate = true;
      }

      // データの更新が必要な場合、Firestoreを更新
      if (needsUpdate) {
        const updateData = {
          dueDate: processedData.dueDate,
          updatedAt: defaultTimestamp
        };
        console.log('Updating task with default date:', processedData.id);
        await updateDoc(docRef, updateData);
      }

      console.log('Processed task data:', processedData);
      return processedData as Task;
    }));

    console.log('All tasks fetched:', tasks);
    return tasks;
  }

  async createTask(task: Omit<Task, 'id'>): Promise<string> {
    const tasksCollection = collection(this.firestore, 'tasks');
    const now = new Date();
    const currentTimestamp = {
      seconds: Math.floor(now.getTime() / 1000),
      nanoseconds: 0
    };

    const docRef = await addDoc(tasksCollection, {
      ...task,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp
    });
    return docRef.id;
  }

  async updateTask(id: string, task: Partial<Task>): Promise<void> {
    console.log('Updating task with ID:', id);
    console.log('Update data received:', task);

    const taskDoc = doc(this.firestore, 'tasks', id);
    
    // Timestampフィールドの処理
    const updateData: any = {
      ...task,
      updatedAt: Timestamp.fromDate(new Date())
    };

    // dueDateがある場合は、Timestampに変換
    if (updateData.dueDate && typeof updateData.dueDate === 'object' && 'seconds' in updateData.dueDate) {
      updateData.dueDate = new Timestamp(
        updateData.dueDate.seconds,
        updateData.dueDate.nanoseconds || 0
      );
    }

    console.log('Final update data:', updateData);
    await updateDoc(taskDoc, updateData);
    console.log('Update completed successfully');
  }

  async deleteTask(id: string): Promise<void> {
    const taskDoc = doc(this.firestore, 'tasks', id);
    await deleteDoc(taskDoc);
  }
}