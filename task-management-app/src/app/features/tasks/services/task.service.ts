import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, onSnapshot, QuerySnapshot, DocumentData } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../models/task.model';
import { Timestamp } from 'firebase/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class TaskService implements OnDestroy {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();
  private unsubscribe: (() => void) | null = null;
  private onlineHandler: () => void;
  private offlineHandler: () => void;

  constructor(
    private firestore: Firestore,
    private snackBar: MatSnackBar,
    private ngZone: NgZone
  ) {
    this.onlineHandler = this.handleOnlineStatus.bind(this);
    this.offlineHandler = this.handleOnlineStatus.bind(this);
    
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    
    this.initializeTasksListener();
  }

  private initializeTasksListener() {
    try {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }

      const tasksRef = collection(this.firestore, 'tasks');
      const q = query(tasksRef, orderBy('createdAt', 'desc'));

      this.unsubscribe = onSnapshot(q, 
        (querySnapshot: QuerySnapshot<DocumentData>) => {
          this.ngZone.run(() => {
            const tasks = querySnapshot.docs.map(doc => {
              const data = doc.data();
              const task: Task = {
                id: doc.id,
                userId: data['userId'] || '',
                title: data['title'] || '',
                description: data['description'] || '',
                status: data['status'] || '未着手',
                priority: data['priority'] || '中',
                category: data['category'] || 'その他',
                assignedTo: data['assignedTo'] || '',
                createdAt: data['createdAt'],
                updatedAt: data['updatedAt'],
                dueDate: data['dueDate']
              };
              return task;
            });
            console.log('Firestore tasks updated:', tasks.length);
            this.tasksSubject.next(tasks);
          });
        },
        (error) => {
          this.ngZone.run(() => {
            console.error('タスクの取得中にエラーが発生しました:', error);
            this.handleError(error);
          });
        }
      );
    } catch (error) {
      console.error('タスクリスナーの初期化中にエラーが発生しました:', error);
      this.handleError(error);
    }
  }

  private handleOnlineStatus() {
    if (!navigator.onLine) {
      this.snackBar.open('オフライン状態です。一部の機能が制限されます。', '閉じる', {
        duration: 5000,
        panelClass: ['warning-snackbar']
      });
    } else {
      this.snackBar.open('オンラインに復帰しました。', '閉じる', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      // オンラインに復帰したらリスナーを再初期化
      this.initializeTasksListener();
    }
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
  }

  private handleError(error: any) {
    let errorMessage = 'エラーが発生しました';
    
    if (error instanceof Error) {
      if (!navigator.onLine || error.message === 'network-error') {
        errorMessage = 'ネットワークエラーが発生しました。インターネット接続をご確認ください。';
      } else if (error.message.includes('permission-denied')) {
        errorMessage = '権限がありません。ログインしているかご確認ください。';
      } else if (error.message.includes('quota')) {
        errorMessage = 'サービスの制限に達しました。しばらく時間をおいて再度お試しください。';
      }
    }
    
    this.snackBar.open(errorMessage, '閉じる', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

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
            userId: data['userId'] || '',
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
            userId: errorData['userId'] || '',
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
    try {
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

      console.log('Task created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
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