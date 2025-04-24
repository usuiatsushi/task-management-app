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
    try {
      console.log('Fetching tasks from Firestore...');
      const tasksCollection = collection(this.firestore, 'tasks');
      const querySnapshot = await getDocs(tasksCollection);
      
      if (querySnapshot.empty) {
        console.log('No tasks found in Firestore');
        return [];
      }

      const tasks = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
        try {
          const data = docSnapshot.data();
          console.log('Raw task data for ID:', docSnapshot.id, data);

          // 現在のタイムスタンプを作成（デフォルト値用）
          const now = new Date();
          const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

          // 日付フィールドの処理
          let dueDate = oneWeekLater; // デフォルト値を設定

          if (data['dueDate']) {
            if (data['dueDate'] instanceof Timestamp) {
              const timestamp = data['dueDate'] as Timestamp;
              const tempDate = timestamp.toDate();
              if (tempDate.getTime() <= new Date(1970, 0, 1).getTime()) {
                console.log('Invalid date detected (1970/1/1), setting to one week later for task:', docSnapshot.id);
              } else {
                console.log('Using existing due date for task:', docSnapshot.id);
                dueDate = tempDate;
              }
            } else if (typeof data['dueDate'] === 'object') {
              const seconds = data['dueDate'].seconds;
              if (!seconds || seconds <= 0) {
                console.log('Invalid timestamp detected, setting to one week later for task:', docSnapshot.id);
              } else {
                dueDate = new Timestamp(seconds, data['dueDate'].nanoseconds || 0).toDate();
                console.log('Converted timestamp to date for task:', docSnapshot.id);
              }
            }
          } else {
            console.log('No due date found, setting to one week later for task:', docSnapshot.id);
          }

          // Firestoreの更新が必要かチェック
          const isDefaultDate = dueDate.getTime() === oneWeekLater.getTime();
          if (isDefaultDate) {
            try {
              const docRef = doc(this.firestore, 'tasks', docSnapshot.id);
              console.log('Updating task due date in Firestore:', docSnapshot.id);
              const updateData = {
                dueDate: {
                  seconds: Math.floor(dueDate.getTime() / 1000),
                  nanoseconds: 0
                },
                updatedAt: {
                  seconds: Math.floor(now.getTime() / 1000),
                  nanoseconds: 0
                }
              };
              await updateDoc(docRef, updateData);
              console.log('Successfully updated task in Firestore:', docSnapshot.id);
            } catch (error) {
              console.error('Error updating task in Firestore:', docSnapshot.id, error);
              // 更新に失敗しても処理は続行
            }
          }

          // 基本的なタスクデータを作成
          const processedData = {
            id: docSnapshot.id,
            title: data['title'] || '',
            description: data['description'] || '',
            status: data['status'] || '未着手',
            priority: data['priority'] || '中',
            category: data['category'] || 'その他',
            assignedTo: data['assignedTo'] || '',
            createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'] : Timestamp.fromDate(now),
            updatedAt: data['updatedAt'] instanceof Timestamp ? data['updatedAt'] : Timestamp.fromDate(now),
            dueDate: Timestamp.fromDate(dueDate)
          };

          console.log('Processed task data:', {
            id: processedData.id,
            title: processedData.title,
            dueDate: processedData.dueDate.toDate()
          });

          return processedData as Task;
        } catch (error) {
          const errorData = docSnapshot.data();
          console.error('Error processing task:', docSnapshot.id, error);
          // エラーが発生しても他のタスクの処理は続行
          return {
            id: docSnapshot.id,
            title: errorData['title'] || '',
            description: errorData['description'] || '',
            status: errorData['status'] || '未着手',
            priority: errorData['priority'] || '中',
            category: errorData['category'] || 'その他',
            assignedTo: errorData['assignedTo'] || '',
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
            dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
          } as Task;
        }
      }));

      // フィルタリングして、正常に処理されたタスクのみを返す
      const validTasks = tasks.filter(task => task !== null) as Task[];
      console.log('Valid tasks count:', validTasks.length);
      return validTasks;

    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
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
    try {
      console.log('Updating task with ID:', id);
      console.log('Update data received:', task);

      const taskDoc = doc(this.firestore, 'tasks', id);
      
      // 更新データの準備
      const updateData: any = { ...task };

      // dueDateの処理
      if (updateData.dueDate) {
        if (updateData.dueDate instanceof Date) {
          updateData.dueDate = {
            seconds: Math.floor(updateData.dueDate.getTime() / 1000),
            nanoseconds: 0
          };
        } else if (updateData.dueDate instanceof Timestamp) {
          const date = updateData.dueDate.toDate();
          updateData.dueDate = {
            seconds: Math.floor(date.getTime() / 1000),
            nanoseconds: 0
          };
        } else if (typeof updateData.dueDate === 'object' && 'seconds' in updateData.dueDate) {
          // すでにタイムスタンプ形式の場合はそのまま使用
          updateData.dueDate = {
            seconds: updateData.dueDate.seconds,
            nanoseconds: updateData.dueDate.nanoseconds || 0
          };
        }
      }

      // updatedAtの設定
      const now = new Date();
      updateData.updatedAt = {
        seconds: Math.floor(now.getTime() / 1000),
        nanoseconds: 0
      };

      console.log('Final update data:', updateData);
      await updateDoc(taskDoc, updateData);
      console.log('Update completed successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    const taskDoc = doc(this.firestore, 'tasks', id);
    await deleteDoc(taskDoc);
  }
}