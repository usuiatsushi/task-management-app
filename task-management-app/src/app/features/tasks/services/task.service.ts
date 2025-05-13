import { Injectable, OnDestroy, NgZone, Inject } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, onSnapshot, QuerySnapshot, DocumentData, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subscription, catchError, map, of, throwError } from 'rxjs';
import { Task } from '../models/task.model';
import { Timestamp } from 'firebase/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { CalendarService } from '../services/calendar.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService implements OnDestroy {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();
  private unsubscribe: (() => void) | null = null;
  private onlineHandler: () => void;
  private offlineHandler: () => void;
  private authSubscription: Subscription | null = null;
  private tasksSubscription: Subscription | null = null;

  constructor(
    private firestore: Firestore,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    @Inject(AuthService) private authService: AuthService,
    private calendarService: CalendarService
  ) {
    this.onlineHandler = this.handleOnlineStatus.bind(this);
    this.offlineHandler = this.handleOnlineStatus.bind(this);
    
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    
    this.initializeAuthListener();
  }

  private initializeAuthListener() {
    this.authSubscription = this.authService.authState$.subscribe((user) => {
      if (user) {
        this.initializeTasksListener();
      } else {
        if (this.unsubscribe) {
          this.unsubscribe();
          this.unsubscribe = null;
        }
        this.tasksSubject.next([]);
      }
    });
  }

  private async initializeTasksListener() {
    try {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }

      const user = await this.authService.getCurrentUser();
      if (!user) return;

      const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
      const userData = userDoc.data();
      const role = userData?.['role'];

      const tasksRef = collection(this.firestore, 'tasks');
      let q;

      if (role === 'admin') {
        // 管理者は全件取得
        q = query(tasksRef, orderBy('createdAt', 'desc'));
      } else {
        // 一般ユーザーは自分のタスクのみ
        q = query(
          tasksRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
      }

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
                importance: data['importance'] || '中',
                category: data['category'] || '',
                assignedTo: data['assignedTo'] || '',
                createdAt: data['createdAt'],
                updatedAt: data['updatedAt'],
                startDate: data['startDate'],
                dueDate: data['dueDate'],
                duration: data['duration'],
                completed: data['completed'] || false,
                urgent: data['urgent'] ?? false,
                projectId: data['projectId'] || ''
              };
              return task;
            });

            // 現在のタスクと新しいタスクを比較
            const currentTasks = this.tasksSubject.value;
            const hasChanges = JSON.stringify(currentTasks) !== JSON.stringify(tasks);
            
            if (hasChanges) {
              console.log('Firestore tasks updated:', tasks.length);
              this.tasksSubject.next(tasks);
            }
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
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
  }

  private handleError(error: any) {
    let errorMessage = 'エラーが発生しました';
    if (error.code === 'permission-denied') {
      errorMessage = 'アクセス権限がありません。ログイン状態を確認してください。';
    } else if (error.code === 'unauthenticated') {
      errorMessage = '認証が必要です。ログインしてください。';
    } else if (error.code === 'failed-precondition') {
      errorMessage = 'データベースの接続に問題が発生しました。';
      }
    this.snackBar.open(errorMessage, '閉じる', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private convertTimestampToDate(timestamp: any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    } else if (typeof timestamp === 'object' && 'seconds' in timestamp) {
      return new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      return new Date(timestamp);
    } else {
      return new Date(timestamp);
    }
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

          // 現在のタイムスタンプを作成
          const now = new Date();

          // 日付フィールドの処理
          let dueDate: Date | null = null;

          if (data['dueDate']) {
            if (data['dueDate'] instanceof Timestamp) {
              const timestamp = data['dueDate'] as Timestamp;
              const tempDate = timestamp.toDate();
              if (tempDate.getTime() <= new Date(1970, 0, 1).getTime()) {
                console.log('Invalid date detected (1970/1/1), setting to null for task:', docSnapshot.id);
              } else {
                console.log('Using existing due date for task:', docSnapshot.id);
                dueDate = tempDate;
              }
            } else if (typeof data['dueDate'] === 'object') {
              const seconds = data['dueDate'].seconds;
              if (!seconds || seconds <= 0) {
                console.log('Invalid timestamp detected, setting to null for task:', docSnapshot.id);
              } else {
                dueDate = new Timestamp(seconds, data['dueDate'].nanoseconds || 0).toDate();
                console.log('Converted timestamp to date for task:', docSnapshot.id);
              }
            }
          }

          // 基本的なタスクデータを作成
          const processedData = {
            id: docSnapshot.id,
            userId: data['userId'] || '',
            title: data['title'] || '',
            description: data['description'] || '',
            status: data['status'] || '未着手',
            importance: data['importance'] || '中',
            category: data['category'] || '',
            assignedTo: data['assignedTo'] || '',
            createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'] : Timestamp.fromDate(now),
            updatedAt: data['updatedAt'] instanceof Timestamp ? data['updatedAt'] : Timestamp.fromDate(now),
            startDate: data['startDate'],
            dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
            duration: data['duration'],
            completed: data['completed'] || false,
            urgent: data['urgent'] ?? false,
            projectId: data['projectId'] || ''
          };

          console.log('Processed task data:', {
            id: processedData.id,
            title: processedData.title,
            dueDate: processedData.dueDate?.toDate() || null
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
            importance: errorData['importance'] || '中',
            category: errorData['category'] || '',
            assignedTo: errorData['assignedTo'] || '',
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
            dueDate: null,
            completed: false,
            urgent: false,
            projectId: errorData['projectId'] || ''
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
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('ユーザーが認証されていません');
    const tasksCollection = collection(this.firestore, 'tasks');
    const now = new Date();
    const currentTimestamp = {
      seconds: Math.floor(now.getTime() / 1000),
      nanoseconds: 0
    };

    const docRef = await addDoc(tasksCollection, {
      ...task,
      userId: user.uid,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp
    });

    console.log('Task created with ID:', docRef.id);
    return docRef.id;
  }

  async updateTask(taskId: string, updateData: Partial<Task>): Promise<void> {
    try {
      console.log('=== タスク更新開始 ===');
      console.log('更新対象タスクID:', taskId);
      console.log('受信した更新データ:', JSON.stringify(updateData, null, 2));

      const taskDoc = doc(this.firestore, 'tasks', taskId);
      const taskSnapshot = await getDoc(taskDoc);
      const currentTask = taskSnapshot.data() as Task;
      console.log('現在のタスクデータ:', JSON.stringify(currentTask, null, 2));
      
      // 日付の処理
      const processedData: any = { ...updateData };

      // startDateの処理
      if (updateData.startDate) {
        console.log('startDateの処理開始:', updateData.startDate);
        if (updateData.startDate instanceof Date) {
          processedData.startDate = Timestamp.fromDate(updateData.startDate);
          console.log('DateからTimestampに変換:', processedData.startDate);
        } else if (updateData.startDate instanceof Timestamp) {
          processedData.startDate = updateData.startDate;
          console.log('既存のTimestampを使用:', processedData.startDate);
        } else if (typeof updateData.startDate === 'object' && updateData.startDate !== null && 'seconds' in updateData.startDate) {
          const dateObj = updateData.startDate as { seconds: number };
          processedData.startDate = Timestamp.fromMillis(dateObj.seconds * 1000);
          console.log('オブジェクトからTimestampに変換:', processedData.startDate);
        }
      }

      // dueDateの処理
      if (updateData.dueDate) {
        console.log('dueDateの処理開始:', updateData.dueDate);
        if (updateData.dueDate instanceof Date) {
          processedData.dueDate = Timestamp.fromDate(updateData.dueDate);
          console.log('DateからTimestampに変換:', processedData.dueDate);
        } else if (updateData.dueDate instanceof Timestamp) {
          processedData.dueDate = updateData.dueDate;
          console.log('既存のTimestampを使用:', processedData.dueDate);
        } else if (typeof updateData.dueDate === 'object' && updateData.dueDate !== null && 'seconds' in updateData.dueDate) {
          const dateObj = updateData.dueDate as { seconds: number };
          processedData.dueDate = Timestamp.fromMillis(dateObj.seconds * 1000);
          console.log('オブジェクトからTimestampに変換:', processedData.dueDate);
        }
      }

      // durationの処理
      if (updateData.duration) {
        console.log('durationの処理開始:', updateData.duration);
        processedData.duration = Number(updateData.duration);
        console.log('数値に変換:', processedData.duration);
      }

      // completedAtの処理
      if (typeof updateData.status !== 'undefined') {
        if (updateData.status === '完了' && currentTask.status !== '完了') {
          // 完了になった瞬間のみセット
          processedData.completedAt = Timestamp.fromDate(new Date());
        } else if (updateData.status !== '完了' && currentTask.status === '完了') {
          // 完了→未完了に戻した場合はリセット
          processedData.completedAt = null;
        }
      }

      // updatedAtの設定
      processedData.updatedAt = Timestamp.fromDate(new Date());

      console.log('最終的な更新データ:', JSON.stringify(processedData, null, 2));
      await updateDoc(taskDoc, processedData);
      console.log('データベース更新完了');

      // カレンダーイベントの更新
      if (currentTask.calendarEventId && (processedData.dueDate || processedData.startDate)) {
        try {
          const updatedTask = {
            ...currentTask,
            ...processedData,
            id: taskId
          };
          console.log('カレンダーイベント更新データ:', JSON.stringify(updatedTask, null, 2));
          await this.calendarService.updateCalendarEvent(updatedTask);
          console.log('カレンダーイベント更新完了');
        } catch (error) {
          console.error('カレンダーイベント更新エラー:', error);
        }
      }
      console.log('=== タスク更新終了 ===');
    } catch (error) {
      console.error('タスク更新エラー:', error);
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    const taskRef = doc(this.firestore, 'tasks', id);
    await deleteDoc(taskRef);
  }

  async getTask(taskId: string): Promise<Task> {
    try {
      console.log('Fetching task from Firestore:', taskId);
      const taskDoc = await getDoc(doc(this.firestore, 'tasks', taskId));
      
      if (!taskDoc.exists()) {
        throw new Error(`Task with ID ${taskId} not found`);
      }
      
      const taskData = taskDoc.data();
      console.log('Raw task data for ID:', taskId, taskData);
      
      // タイムスタンプをDateに変換
      if (taskData && 'dueDate' in taskData) {
        taskData['dueDate'] = this.convertTimestampToDate(taskData['dueDate']);
        console.log('Converted timestamp to date for task:', taskId);
      }
      
      const task = {
        id: taskDoc.id,
        ...taskData
      } as Task;
      
      console.log('Processed task data:', task);
      return task;
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  }

  getTasksByProject(projectId: string): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.projectId === projectId))
    );
  }
}